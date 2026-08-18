(function () {
  const data = window.CogMockData;
  const inRange = (value, start, end) => (!start || value >= start) && (!end || value <= end);
  const operationalDate = (value, granularity = 'day') => {
    const raw = String(value || '');
    const date = raw.slice(0, 10);
    if (granularity !== 'hour' || !raw.includes('T') || Number(raw.slice(11, 13)) >= 7) return date;
    const shifted = new Date(`${date}T00:00:00Z`);
    shifted.setUTCDate(shifted.getUTCDate() - 1);
    return shifted.toISOString().slice(0, 10);
  };
  const byDimensions = (row, filters) => ['plant', 'process', 'product'].every((key) => {
    const sourceValue = String(row[key] || '');
    // The workbook-derived export carries placeholder text for descriptive dimensions.
    // Do not discard valid metric records merely because that non-metric label is unavailable.
    return !filters[key] || !sourceValue || sourceValue.includes('?') || sourceValue === filters[key];
  });
  const latestBy = (items, predicate) => items.filter(predicate).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1);

  function getActiveStandard(metricId, at = '9999-12-31') {
    return latestBy(data.standards, (standard) => standard.metricId === metricId && standard.effectiveFrom <= at);
  }
  function getObservations(filters = {}) {
    const dailyFilters = { ...filters, start: operationalDate(filters.start, filters.granularity), end: operationalDate(filters.end, filters.granularity) };
    return data.dailyObservations.filter((row) => byDimensions(row, dailyFilters) && inRange(row.period, dailyFilters.start, dailyFilters.end));
  }
  function evaluateMetric(metricId, value, at) {
    const standard = getActiveStandard(metricId, at);
    if (!standard) return { status: 'normal', standard: null, variance: 0 };
    const overWarning = (standard.warningMax !== undefined && value > standard.warningMax) || (standard.warningMin !== undefined && value < standard.warningMin);
    const outsideNormal = (standard.normalMax !== undefined && value > standard.normalMax) || (standard.normalMin !== undefined && value < standard.normalMin);
    const reference = standard.normalMax ?? standard.normalMin ?? standard.target;
    return { status: overWarning ? 'abnormal' : outsideNormal ? 'warning' : 'normal', standard, variance: +(value - reference).toFixed(3) };
  }
  function getMetricSeries(metricId, filters = {}) {
    return getObservations(filters).map((row) => ({ period: row.period, value: row.metrics[metricId], evaluation: evaluateMetric(metricId, row.metrics[metricId], row.period) }));
  }
  function getKpiSummaries(filters = {}) {
    const observations = getObservations(filters);
    const latest = observations.at(-1);
    return data.metricDefinitions.map((definition) => {
      if (!latest) {
        return { ...definition, value: null, period: null, series: [], status: 'noData', standard: getActiveStandard(definition.id, filters.end?.slice(0, 10)), variance: null, targetVariance: null, hasData: false };
      }
      const values = observations.map((row) => row.metrics[definition.id]).filter((value) => Number.isFinite(value));
      const value = values.length > 1 ? values.reduce((sum, item) => sum + item, 0) / values.length : latest.metrics[definition.id];
      const evaluation = evaluateMetric(definition.id, value, latest.period);
      const series = getMetricSeries(definition.id, filters);
      return { ...definition, value, period: latest.period, series, ...evaluation, targetVariance: +(value - evaluation.standard.target).toFixed(3), hasData: true };
    });
  }
  function getEvents(filters = {}) {
    const start = filters.start?.slice(0, 10);
    const end = filters.end?.slice(0, 10);
    return data.events.filter((event) => {
      const eventStart = event.startAt.slice(0, 10);
      const eventEnd = event.endAt.slice(0, 10);
      return (!start || eventEnd >= start) && (!end || eventStart <= end);
    });
  }
  function getPeriodIssueOccurrences(filters = {}) {
    const issueStart = operationalDate(filters.start, filters.granularity);
    const issueEnd = operationalDate(filters.end, filters.granularity);
    const statuses = (data.dailyStatuses || [])
      .filter((item) => inRange(item.period, issueStart, issueEnd) && item.status !== 'normal')
      .sort((a, b) => a.metricId.localeCompare(b.metricId) || a.status.localeCompare(b.status) || a.period.localeCompare(b.period));
    const nextDate = (period) => {
      const date = new Date(period + 'T00:00:00Z');
      date.setUTCDate(date.getUTCDate() + 1);
      return date.toISOString().slice(0, 10);
    };
    const groups = [];
    statuses.forEach((status) => {
      const previous = groups.at(-1);
      if (previous && previous.metricId === status.metricId && previous.status === status.status && nextDate(previous.end) === status.period) {
        previous.end = status.period;
        previous.days += 1;
        return;
      }
      const definition = data.metricDefinitions.find((item) => item.id === status.metricId);
      if (definition) groups.push({ ...definition, metricId: status.metricId, status: status.status, start: status.period, end: status.period, days: 1 });
    });
    return groups;
  }
  function getPeriodIssues(filters = {}) {
    const observations = getObservations(filters);
    const issueStart = operationalDate(filters.start, filters.granularity);
    const issueEnd = operationalDate(filters.end, filters.granularity);
    if (data.dailyStatuses?.length) {
      const statuses = data.dailyStatuses.filter((item) => inRange(item.period, issueStart, issueEnd) && item.status !== 'normal');
      const issueIds = [...new Set(statuses.map((item) => item.metricId))];
      return issueIds.map((metricId) => {
        const definition = data.metricDefinitions.find((item) => item.id === metricId);
        const status = statuses.filter((item) => item.metricId === metricId).at(-1);
        const row = observations.find((item) => item.period === status.period);
        if (!definition || !row) return null;
        const evaluation = evaluateMetric(metricId, row.metrics[metricId], row.period);
        return { ...definition, value: row.metrics[metricId], period: row.period, series: getMetricSeries(metricId, filters), ...evaluation, status: status.status, targetVariance: +(row.metrics[metricId] - evaluation.standard.target).toFixed(3), hasData: true };
      }).filter(Boolean);
    }
    const sourceStatuses = (data.dailyStatuses || []).filter((item) => inRange(item.period, issueStart, issueEnd) && !String(item.status).includes('정상'));
    const issueIds = new Set(sourceStatuses.map((item) => item.metricId));
    if (!sourceStatuses.length) {
      observations.forEach((row) => data.metricDefinitions.forEach((definition) => {
        if (evaluateMetric(definition.id, row.metrics[definition.id], row.period).status !== 'normal') issueIds.add(definition.id);
      }));
    }
    return [...issueIds].map((metricId) => {
      const definition = data.metricDefinitions.find((item) => item.id === metricId);
      const sourceStatus = sourceStatuses.filter((item) => item.metricId === metricId).at(-1);
      const row = observations.filter((item) => item.period === sourceStatus?.period).at(-1) || observations.at(-1);
      if (!definition || !row) return null;
      const evaluation = evaluateMetric(metricId, row.metrics[metricId], row.period);
      return { ...definition, value: row.metrics[metricId], period: row.period, series: getMetricSeries(metricId, filters), ...evaluation, status: sourceStatus ? (String(sourceStatus.status).includes('이상') ? 'abnormal' : 'warning') : evaluation.status, targetVariance: +(row.metrics[metricId] - evaluation.standard.target).toFixed(3), hasData: true };
    }).filter(Boolean);
  }
  function getCostRecordsUncached(filters = {}) {
    if (data.costObservations?.length) {
      const normalizeTimestamp = (value, boundary) => {
        if (!value) return '';
        if (value.length === 10) return `${value}T${boundary === 'end' ? '23:59:59' : '00:00:00'}`;
        return value.length === 16 ? `${value}:00` : value;
      };
      const dayBoundary = (value, days, time) => {
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + days);
        return `${date.toISOString().slice(0, 10)}T${time}`;
      };
      const dayMode = filters.granularity === 'day' || (filters.granularity === 'month' && !String(filters.start || '').includes('T') && !String(filters.end || '').includes('T'));
      const start = dayMode ? dayBoundary(filters.start, 0, '07:00:00') : normalizeTimestamp(filters.start, 'start');
      const end = dayMode ? dayBoundary(filters.end, 1, '06:59:59') : normalizeTimestamp(filters.end, 'end');
      if (data.monthlyCostImpacts?.length) {
        const values = (row) => Object.values(row);
        const operationMonth = (timestamp) => { const at = new Date(`${timestamp.slice(0, 19)}Z`); at.setUTCHours(at.getUTCHours() - 7); return at.toISOString().slice(0, 7); };
        const operationPeriod = (timestamp) => filters.granularity === 'day' ? operationalDate(timestamp, 'hour') : operationMonth(timestamp);
        const counts = data.costObservations.reduce((result, row) => { const month = operationMonth(row.timestamp); result[month] = (result[month] || 0) + 1; return result; }, {});
        const sourceRows = (timestamp) => data.monthlyCostImpacts.filter((row) => values(row)[0] === operationMonth(timestamp));
        const perHourTarget = (source, timestamp) => Number(values(source)[4]) / counts[operationMonth(timestamp)];
        const rate = (source) => Number(values(source)[6]);
        const rows = data.costObservations.filter((row) => (!start || row.timestamp >= start) && (!end || row.timestamp <= end)).flatMap((row) => {
          const [gas, chemicalA, chemicalB, steam] = sourceRows(row.timestamp);
          if (!gas || !chemicalA || !chemicalB || !steam) return [];
          const gasTarget = perHourTarget(gas, row.timestamp), aTarget = perHourTarget(chemicalA, row.timestamp), bTarget = perHourTarget(chemicalB, row.timestamp), steamTarget = perHourTarget(steam, row.timestamp);
          const requested = filters.costItem || '';
          const chemicalTotal = '약품 전체';
          const chemicalAItem = '약품 A';
          const chemicalBItem = '약품 B';
          const include = (item) => !requested || requested === item;
          const includeChemical = (item) => requested === item;
          return [
            include(values(gas)[1]) ? { costItem: values(gas)[1], usageLabel: values(gas)[1], usageUnit: 'Nm3', actualUsage: row.gasQuantity, targetUsage: gasTarget, impact: (row.gasQuantity - gasTarget) * rate(gas) / 1000000 } : null,
            include(chemicalTotal) ? { costItem: chemicalTotal, usageLabel: chemicalTotal, usageUnit: 'kg', actualUsage: row.chemicalAUsage + row.chemicalBUsage, targetUsage: aTarget + bTarget, impact: ((aTarget - row.chemicalAUsage) * rate(chemicalA) + (bTarget - row.chemicalBUsage) * rate(chemicalB)) / 1000000 } : null,
            includeChemical(chemicalAItem) ? { costItem: chemicalAItem, usageLabel: chemicalAItem, usageUnit: 'kg', actualUsage: row.chemicalAUsage, targetUsage: aTarget, impact: (aTarget - row.chemicalAUsage) * rate(chemicalA) / 1000000 } : null,
            includeChemical(chemicalBItem) ? { costItem: chemicalBItem, usageLabel: chemicalBItem, usageUnit: 'kg', actualUsage: row.chemicalBUsage, targetUsage: bTarget, impact: (bTarget - row.chemicalBUsage) * rate(chemicalB) / 1000000 } : null,
            include(values(steam)[1]) ? { costItem: values(steam)[1], usageLabel: values(steam)[1], usageUnit: 't/h', actualUsage: row.steamUsage, targetUsage: steamTarget, impact: (steamTarget - row.steamUsage) * rate(steam) / 1000000 } : null,
          ].filter(Boolean).map((item) => ({ ...item, timestamp: row.timestamp, period: operationPeriod(row.timestamp) }));
        }).filter((row) => !filters.costItem || row.costItem === filters.costItem);
        const groups = new Map();
        rows.forEach((row) => { const key = `${row.period}|${row.costItem}`; const previous = groups.get(key) || { period: row.period, costItem: row.costItem, usageLabel: row.usageLabel, usageUnit: row.usageUnit, actualProfitImpact: 0, baselineProfitImpact: 0, actualUsage: 0, targetUsage: 0, plannedUsage: 0, unit: 'M KRW' }; previous.actualProfitImpact += row.impact; previous.actualUsage += row.actualUsage; previous.targetUsage += row.targetUsage; previous.plannedUsage += row.targetUsage; groups.set(key, previous); });
        return [...groups.values()].map((row) => ({ ...row, actualProfitImpact: +row.actualProfitImpact.toFixed(3), baselineProfitImpact: 0, actualUsage: +row.actualUsage.toFixed(3), targetUsage: +row.targetUsage.toFixed(3), plannedUsage: +row.plannedUsage.toFixed(3), variance: +row.actualProfitImpact.toFixed(3) }));
      }
      if (data.monthlyCostImpacts?.length && Object.keys(data.costLabels || {}).length) {
        const values = (row) => Object.values(row);
        const operationMonth = (timestamp) => {
          const at = new Date(`${timestamp.slice(0, 19)}Z`); at.setUTCHours(at.getUTCHours() - 7); return at.toISOString().slice(0, 7);
        };
        const counts = data.costObservations.reduce((result, row) => {
          const month = operationMonth(row.timestamp); result[month] = (result[month] || 0) + 1; return result;
        }, {});
        const sourceRows = (timestamp) => data.monthlyCostImpacts.filter((row) => values(row)[0] === operationMonth(timestamp));
        const sourceTarget = (row, timestamp) => Number(values(row)[4]) / counts[operationMonth(timestamp)];
        const sourceRate = (row) => Number(values(row)[6]);
        const rows = data.costObservations.filter((row) => (!start || row.timestamp >= start) && (!end || row.timestamp <= end)).flatMap((row) => {
          const [gas, chemicalA, chemicalB, steam] = sourceRows(row.timestamp);
          if (!gas || !chemicalA || !chemicalB || !steam) return [];
          const gasTarget = sourceTarget(gas, row.timestamp), aTarget = sourceTarget(chemicalA, row.timestamp), bTarget = sourceTarget(chemicalB, row.timestamp), steamTarget = sourceTarget(steam, row.timestamp);
          return [
            { costItem: data.costLabels.gas, usageLabel: data.costLabels.gas, usageUnit: 'Nm3', actualUsage: row.gasQuantity, targetUsage: gasTarget, impact: (row.gasQuantity - gasTarget) * sourceRate(gas) / 1000000 },
            { costItem: data.costLabels.chemical, usageLabel: data.costLabels.chemical, usageUnit: 'kg', actualUsage: row.chemicalAUsage + row.chemicalBUsage, targetUsage: aTarget + bTarget, impact: ((aTarget - row.chemicalAUsage) * sourceRate(chemicalA) + (bTarget - row.chemicalBUsage) * sourceRate(chemicalB)) / 1000000 },
            { costItem: data.costLabels.steam, usageLabel: data.costLabels.steam, usageUnit: 't/h', actualUsage: row.steamUsage, targetUsage: steamTarget, impact: (steamTarget - row.steamUsage) * sourceRate(steam) / 1000000 },
          ].map((item) => ({ ...item, timestamp: row.timestamp, period: operationMonth(row.timestamp) }));
        }).filter((row) => !filters.costItem || row.costItem === filters.costItem);
        const groups = new Map();
        rows.forEach((row) => {
          const key = `${row.period}|${row.costItem}`;
          const previous = groups.get(key) || { period: row.period, costItem: row.costItem, usageLabel: row.usageLabel, usageUnit: row.usageUnit, actualProfitImpact: 0, baselineProfitImpact: 0, actualUsage: 0, targetUsage: 0, plannedUsage: 0, unit: '백만원' };
          previous.actualProfitImpact += row.impact; previous.actualUsage += row.actualUsage; previous.targetUsage += row.targetUsage; previous.plannedUsage += row.targetUsage; groups.set(key, previous);
        });
        return [...groups.values()].map((row) => ({ ...row, actualProfitImpact: +row.actualProfitImpact.toFixed(3), baselineProfitImpact: 0, actualUsage: +row.actualUsage.toFixed(3), targetUsage: +row.targetUsage.toFixed(3), plannedUsage: +row.plannedUsage.toFixed(3), variance: +row.actualProfitImpact.toFixed(3) }));
      }
      // The workbook has actual hourly observations and monthly target totals.
      // Allocate only the supplied monthly target evenly across its actual
      // source hours; no UI-side weighting or seed values are introduced.
      if (data.monthlyCostImpacts?.length) {
        const monthlyRows = data.monthlyCostImpacts;
        const operationMonth = (timestamp) => {
          const at = new Date(`${timestamp.slice(0, 19)}Z`);
          at.setUTCHours(at.getUTCHours() - 7);
          return at.toISOString().slice(0, 7);
        };
        const monthHourCounts = data.costObservations.reduce((counts, item) => {
          const month = operationMonth(item.timestamp); counts[month] = (counts[month] || 0) + 1; return counts;
        }, {});
        const sourceRow = (month, item) => monthlyRows.find((row) => row['월'] === month && row['원가항목'] === item);
        const targetPerHour = (timestamp, item) => {
          const month = operationMonth(timestamp); const row = sourceRow(month, item);
          return row ? Number(row['목표량']) / monthHourCounts[month] : 0;
        };
        const sourceRate = (timestamp, item) => Number(sourceRow(operationMonth(timestamp), item)?.['가상단가'] || 0);
        const rows = data.costObservations
          .filter((row) => (!start || row.timestamp >= start) && (!end || row.timestamp <= end))
          .flatMap((row) => {
            const gasTarget = targetPerHour(row.timestamp, '가스량');
            const chemicalATarget = targetPerHour(row.timestamp, '약품 A');
            const chemicalBTarget = targetPerHour(row.timestamp, '약품 B');
            const steamTarget = targetPerHour(row.timestamp, '스팀');
            return [
              { costItem: '가스량 영향', usageLabel: '가스량', usageUnit: 'Nm³', actualUsage: row.gasQuantity, targetUsage: gasTarget, impact: (row.gasQuantity - gasTarget) * sourceRate(row.timestamp, '가스량') / 1000000 },
              { costItem: '약품비 절감', usageLabel: '약품 A+B 사용량', usageUnit: 'kg', actualUsage: row.chemicalAUsage + row.chemicalBUsage, targetUsage: chemicalATarget + chemicalBTarget, impact: ((chemicalATarget - row.chemicalAUsage) * sourceRate(row.timestamp, '약품 A') + (chemicalBTarget - row.chemicalBUsage) * sourceRate(row.timestamp, '약품 B')) / 1000000 },
              { costItem: '스팀 절감', usageLabel: '스팀 사용량', usageUnit: 't/h', actualUsage: row.steamUsage, targetUsage: steamTarget, impact: (steamTarget - row.steamUsage) * sourceRate(row.timestamp, '스팀') / 1000000 },
            ].map((item) => ({ ...item, timestamp: row.timestamp, period: operationMonth(row.timestamp) }));
          })
          .filter((row) => !filters.costItem || row.costItem === filters.costItem);
        const groups = new Map();
        rows.forEach((row) => {
          const key = `${row.period}|${row.costItem}`;
          const previous = groups.get(key) || { period: row.period, costItem: row.costItem, usageLabel: row.usageLabel, usageUnit: row.usageUnit, actualProfitImpact: 0, baselineProfitImpact: 0, actualUsage: 0, targetUsage: 0, plannedUsage: 0, unit: '백만원' };
          previous.actualProfitImpact += row.impact;
          previous.actualUsage += row.actualUsage;
          previous.targetUsage += row.targetUsage;
          previous.plannedUsage += row.targetUsage;
          groups.set(key, previous);
        });
        return [...groups.values()].map((row) => ({ ...row, actualProfitImpact: +row.actualProfitImpact.toFixed(3), baselineProfitImpact: 0, actualUsage: +row.actualUsage.toFixed(3), targetUsage: +row.targetUsage.toFixed(3), plannedUsage: +row.plannedUsage.toFixed(3), variance: +row.actualProfitImpact.toFixed(3) }));
      }
      const steamUnitPrice = (timestamp) => {
        const year = timestamp.slice(0, 4);
        const quarter = Math.floor((Number(timestamp.slice(5, 7)) - 1) / 3) + 1;
        return ({ 2024: [1400000, 1500000, 1600000, 1500000], 2025: [1600000, 1700000, 1800000, 1700000] })[year]?.[quarter - 1] || 0;
      };
      const rows = data.costObservations
        .filter((row) => (!start || row.timestamp >= start) && (!end || row.timestamp <= end))
        .flatMap((row) => {
          const targets = data.costTargets;
          const steamPrice = steamUnitPrice(row.timestamp);
          return [
            { costItem: '생산량 증대 영향', usageLabel: '가스 사용량', usageUnit: 'Nm³', actualUsage: row.gasQuantity, targetUsage: targets.gas, impact: (row.gasQuantity - targets.gas) * 90 / 1000000 },
            { costItem: '자재비 절감', usageLabel: '약품 A+B 사용량', usageUnit: 'kg', actualUsage: row.chemicalAUsage + row.chemicalBUsage, targetUsage: targets.chemicalA + targets.chemicalB, impact: ((targets.chemicalA - row.chemicalAUsage) * 154000 + (targets.chemicalB - row.chemicalBUsage) * 128000) / 1000000 },
            { costItem: '유틸리티 절감', usageLabel: '스팀 사용량', usageUnit: 't/h', actualUsage: row.steamUsage, targetUsage: targets.steam, impact: (targets.steam - row.steamUsage) * steamPrice / 1000000 },
          ].map((item) => ({ ...item, timestamp: row.timestamp, period: row.timestamp.slice(0, 7) }));
        })
        .filter((row) => !filters.costItem || row.costItem === filters.costItem);
      const groups = new Map();
      rows.forEach((row) => {
        const key = `${row.period}|${row.costItem}`;
        const previous = groups.get(key) || { period: row.period, costItem: row.costItem, usageLabel: row.usageLabel, usageUnit: row.usageUnit, actualProfitImpact: 0, baselineProfitImpact: 0, actualUsage: 0, targetUsage: 0, plannedUsage: 0, unit: '백만원' };
        previous.actualProfitImpact += row.impact;
        previous.actualUsage += row.actualUsage;
        previous.targetUsage += row.targetUsage;
        previous.plannedUsage += row.targetUsage;
        groups.set(key, previous);
      });
      return [...groups.values()].map((row) => ({ ...row, actualProfitImpact: +row.actualProfitImpact.toFixed(3), baselineProfitImpact: 0, actualUsage: +row.actualUsage.toFixed(3), targetUsage: +row.targetUsage.toFixed(3), plannedUsage: +row.plannedUsage.toFixed(3), variance: +row.actualProfitImpact.toFixed(3) }));
    }
    return data.costRecords
      .filter((row) => byDimensions(row, filters) && (!filters.costItem || row.costItem === filters.costItem) && inRange(row.period, filters.start?.slice(0, 7), filters.end?.slice(0, 7)))
      .map((row) => {
        const { actualProfitImpact, baselineProfitImpact } = row;
        return { ...row, variance: +(actualProfitImpact - baselineProfitImpact).toFixed(3) };
      });
  }
  function getCostRecords(filters = {}) {
    // Always read the current shared source so an updated observation is
    // immediately reflected in every period summary and downstream view.
    return getCostRecordsUncached(filters);
  }
  function summarizeCostRows(rows) {
    return rows.reduce((summary, row) => ({
      actualProfitImpact: +(summary.actualProfitImpact + row.actualProfitImpact).toFixed(1),
      baselineProfitImpact: +(summary.baselineProfitImpact + row.baselineProfitImpact).toFixed(1),
      variance: +(summary.variance + row.variance).toFixed(1),
      actualUsage: +(summary.actualUsage + row.actualUsage).toFixed(1),
      targetUsage: +(summary.targetUsage + row.targetUsage).toFixed(1),
    }), { actualProfitImpact: 0, baselineProfitImpact: 0, variance: 0, actualUsage: 0, targetUsage: 0 });
  }
  function getCostSummary(filters = {}) { return summarizeCostRows(getCostRecords(filters)); }
  function groupCostByItem(filters = {}) {
    const records = getCostRecords(filters);
    return [...new Set(records.map((row) => row.costItem))].map((costItem) => {
      const itemRows = records.filter((row) => row.costItem === costItem);
      return { ...itemRows[0], costItem, ...summarizeCostRows(itemRows) };
    });
  }
  window.CogDataService = { getActiveStandard, getObservations, evaluateMetric, getMetricSeries, getKpiSummaries, getEvents, getPeriodIssueOccurrences, getPeriodIssues, getCostRecords, getCostSummary, groupCostByItem };
}());
