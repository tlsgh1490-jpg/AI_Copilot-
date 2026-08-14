(function () {
  const metricDefinitions = [
    { id: 'purifiedVolume', label: '정제량', unit: 'k Nm³', direction: 'range', decimals: 0 },
    { id: 'aUnit', label: 'A 생산원단위', unit: 'kg/t', direction: 'upper', decimals: 1 },
    { id: 'bUnit', label: 'B 생산원단위', unit: 'kg/t', direction: 'upper', decimals: 1 },
    { id: 'cUnit', label: 'C 생산원단위', unit: 'kg/t', direction: 'upper', decimals: 1 },
    { id: 'chemicalA', label: '약품 A 원단위', unit: 'kg/t', direction: 'upper', decimals: 1 },
    { id: 'chemicalB', label: '약품 B 원단위', unit: 'kg/t', direction: 'upper', decimals: 1 },
    { id: 'steamUsage', label: '스팀 사용량', unit: 't/h', direction: 'range', decimals: 1 },
    { id: 'qualityContent', label: '품질함량', unit: '%', direction: 'upper', decimals: 1 },
    { id: 'gasOutletTemp', label: '가스 출구온도', unit: '℃', direction: 'range', decimals: 1 },
    { id: 'steamM01', label: '스팀 M01', unit: 't/h', direction: 'range', decimals: 2 },
    { id: 'steamM02', label: '스팀 M02', unit: 't/h', direction: 'range', decimals: 2 },
    { id: 'steamM03', label: '스팀 M03', unit: 't/h', direction: 'range', decimals: 2 },
    { id: 'steamM04', label: '스팀 M04', unit: 't/h', direction: 'range', decimals: 2 },
    { id: 'steamM05', label: '스팀 M05', unit: 't/h', direction: 'range', decimals: 2 },
    { id: 'steamM06', label: '스팀 M06', unit: 't/h', direction: 'range', decimals: 2 },
    { id: 'equipmentPressure', label: '설비 차압', unit: 'bar', direction: 'range', decimals: 1 },
    { id: 'gasFlow', label: '유량', unit: 'm³/h', direction: 'range', decimals: 1 },
    { id: 'lgRatio', label: 'L/G비', unit: '', direction: 'range', decimals: 1 },
    { id: 'equipmentTemp', label: '설비온도', unit: '℃', direction: 'range', decimals: 1 },
    { id: 'oilFlow', label: '오일 유량', unit: 'm³/h', direction: 'range', decimals: 1 },
    { id: 'heatTransfer', label: '총괄열전달계수', unit: 'W/(m²·K)', direction: 'range', decimals: 1 },
    { id: 'gasPressure', label: '설비가동율', unit: '%', direction: 'range', decimals: 1 },
    { id: 'steamPressure', label: '원료장입량', unit: 'kg', direction: 'range', decimals: 1 },
    { id: 'coolingWaterTemp', label: '휘발분', unit: '%', direction: 'range', decimals: 1 },
    { id: 'exhaustSpeed', label: '농도', unit: 'g/L', direction: 'range', decimals: 1 },
  ];
  metricDefinitions.forEach((definition) => {
    definition.label = `${definition.label} (${definition.unit || '비'})`;
  });

  let standards = [
    { effectiveFrom: '2024-01-01', metricId: 'purifiedVolume', normalMin: 1012, normalMax: 1081, warningMin: 1000, warningMax: 1093, target: 1042 },
    { effectiveFrom: '2024-01-01', metricId: 'aUnit', normalMax: 16.0, warningMax: 16.4, target: 15.4 },
    { effectiveFrom: '2024-01-01', metricId: 'bUnit', normalMax: 11.1, warningMax: 11.4, target: 10.3 },
    { effectiveFrom: '2024-01-01', metricId: 'cUnit', normalMax: 7.2, warningMax: 7.4, target: 6.7 },
    { effectiveFrom: '2024-01-01', metricId: 'chemicalA', normalMax: 0.470, warningMax: 0.474, target: 0.472 },
    { effectiveFrom: '2024-01-01', metricId: 'chemicalB', normalMax: 0.405, warningMax: 0.412, target: 0.392 },
    { effectiveFrom: '2024-01-01', metricId: 'steamUsage', normalMin: 35.7006, normalMax: 36.7467, warningMin: 35.4391, warningMax: 36.9303, target: 36.6412 },
    { effectiveFrom: '2024-01-01', metricId: 'qualityContent', normalMax: 2.30, warningMax: 2.35, target: 2.14 },
    { effectiveFrom: '2024-01-01', metricId: 'gasOutletTemp', normalMin: 135, normalMax: 145, warningMin: 132, warningMax: 148, target: 140 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM01', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM02', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM03', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM04', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'equipmentPressure', normalMin: 59.4, normalMax: 63.5, warningMin: 58.5, warningMax: 64.5, target: 61.0 },
    { effectiveFrom: '2025-07-01', metricId: 'steamUsage', normalMin: 35.7006, normalMax: 36.7467, warningMin: 35.4391, warningMax: 36.9303, target: 36.6412 },
    { effectiveFrom: '2024-01-01', metricId: 'gasFlow', normalMin: 4000, normalMax: 4600, warningMin: 3800, warningMax: 4800, target: 4300 },
    { effectiveFrom: '2024-01-01', metricId: 'lgRatio', normalMin: 1.40, normalMax: 1.55, warningMin: 1.35, warningMax: 1.60, target: 1.46 },
    { effectiveFrom: '2024-01-01', metricId: 'equipmentTemp', normalMin: 820, normalMax: 880, warningMin: 800, warningMax: 900, target: 850 },
    { effectiveFrom: '2024-01-01', metricId: 'oilFlow', normalMin: 110, normalMax: 150, warningMin: 100, warningMax: 160, target: 130 },
    { effectiveFrom: '2024-01-01', metricId: 'heatTransfer', normalMin: 45, normalMax: 65, warningMin: 40, warningMax: 70, target: 55 },
    { effectiveFrom: '2024-01-01', metricId: 'gasPressure', normalMin: 0.8755, normalMax: 0.9249, warningMin: 0.8663, warningMax: 0.9328, target: 0.9002 },
    { effectiveFrom: '2024-01-01', metricId: 'steamPressure', normalMin: 1086.9751, normalMax: 1125.8232, warningMin: 1081.2962, warningMax: 1132.6979, target: 1106.39915 },
    { effectiveFrom: '2024-01-01', metricId: 'coolingWaterTemp', normalMin: 26.5053, normalMax: 27.5806, warningMin: 26.2576, warningMax: 27.7376, target: 27.04295 },
    { effectiveFrom: '2024-01-01', metricId: 'exhaustSpeed', normalMin: 54.5385, normalMax: 56.1479, warningMin: 54.3399, warningMax: 56.4317, target: 55.3432 },
  ];
  if (window.CogSourceStandards?.length) standards = window.CogSourceStandards;
  standards = standards.map((standard) => {
    if (standard.metricId === 'steamUsage') return {
      ...standard,
      target: 15.075,
      normalMin: 14.875,
      normalMax: 15.305,
      warningMin: 14.775,
      warningMax: 15.405,
    };
    return standard;
  });
  const steamAverageStandards = standards.filter((standard) => standard.metricId === 'steamM01M04');
  if (steamAverageStandards.length) {
    standards = standards.filter((standard) => standard.metricId !== 'steamM01M04');
    ['steamM01', 'steamM02', 'steamM03', 'steamM04', 'steamM05', 'steamM06'].forEach((metricId) => steamAverageStandards.forEach((standard) => standards.push({ ...standard, metricId })));
  }
  // Apply the same tenfold display scale to module-level steam criteria after
  // any legacy M01~M04 standard has been expanded to M01~M06.
  standards = standards.map((standard) => /^steamM0[1-6]$/.test(standard.metricId)
    ? Object.fromEntries(Object.entries(standard).map(([key, value]) => (
      ['target', 'normalMin', 'normalMax', 'warningMin', 'warningMax'].includes(key) && Number.isFinite(Number(value)) ? [key, +(Number(value) * 10).toFixed(6)] : [key, value]
    )))
    : standard);

  let dailyObservations = Array.from({ length: 152 }, (_, index) => {
    const day = new Date(Date.UTC(2025, 7, 2 + index));
    const date = day.toISOString().slice(0, 10);
    const cycle = Math.sin(index * 0.62);
    const qualityRise = index > 30 ? (index - 30) * 0.025 : 0;
    return {
      timestamp: `${date}T07:00:00`,
      period: date,
      plant: '화성공장',
      process: 'COG 정제공정',
      product: 'COG',
      metrics: {
        purifiedVolume: Math.round(1050 + cycle * 20 + (index % 4) * 3),
        aUnit: +(15.5 + Math.cos(index * 0.5) * 0.25).toFixed(1),
        bUnit: +(10.4 + Math.sin(index * 0.4) * 0.25).toFixed(1),
        cUnit: +(6.8 + Math.cos(index * 0.35) * 0.18).toFixed(1),
        chemicalA: +(0.455 + Math.sin(index * 0.6) * 0.007 + (index > 35 ? 0.014 : 0)).toFixed(3),
        chemicalB: +(0.392 + Math.cos(index * 0.45) * 0.006).toFixed(3),
        steamUsage: Math.round(980 + Math.cos(index * 0.42) * 25 - (index > 33 ? 12 : 0)),
        qualityContent: +(2.12 + cycle * 0.035 + qualityRise).toFixed(2),
        gasOutletTemp: +(140 + Math.cos(index * 0.38) * 2.4 + (index > 30 ? 1.2 : 0)).toFixed(1),
        steamM01M04: +(0.252 + Math.sin(index * 0.52) * 0.011 - (index > 30 ? 0.008 : 0)).toFixed(3),
        equipmentPressure: +(61.2 + Math.cos(index * 0.48) * 1.1).toFixed(1),
        gasFlow: Math.round(4300 + Math.sin(index * 0.34) * 210),
        lgRatio: +(1.46 + Math.cos(index * 0.29) * 0.035).toFixed(2),
        equipmentTemp: +(850 + Math.sin(index * 0.22) * 18).toFixed(1),
        oilFlow: Math.round(130 + Math.cos(index * 0.31) * 12),
        heatTransfer: +(55 + Math.sin(index * 0.27) * 5).toFixed(1),
        gasPressure: +(12.4 + Math.cos(index * 0.36) * 0.7).toFixed(1),
        steamPressure: +(8.2 + Math.sin(index * 0.33) * 0.5).toFixed(1),
        coolingWaterTemp: +(32.5 + Math.cos(index * 0.25) * 2.2).toFixed(1),
        exhaustSpeed: Math.round(1450 + Math.sin(index * 0.38) * 130),
      },
    };
  });
  dailyObservations[dailyObservations.length - 1].metrics.qualityContent = 2.38;
  dailyObservations[dailyObservations.length - 1].metrics.chemicalA = 0.475;
  dailyObservations[dailyObservations.length - 1].metrics.purifiedVolume = 1058;
  dailyObservations[dailyObservations.length - 1].metrics.steamUsage = 963;
  const priorYearObservations = dailyObservations.map((row, index) => ({
    ...row,
    timestamp: row.timestamp.replace('2025', '2024'),
    period: row.period.replace('2025', '2024'),
    metrics: Object.fromEntries(Object.entries(row.metrics).map(([metricId, value]) => [metricId, typeof value === 'number' ? +(value * (metricId === 'qualityContent' ? 0.96 : 0.985) + Math.sin(index * 0.3) * 0.01).toFixed(3) : value])),
  }));
  dailyObservations.unshift(...priorYearObservations);
  // The approved screens use the workbook-derived daily aggregation when it is available.
  if (window.CogWorkbookSource?.dailyObservations?.length) dailyObservations = window.CogWorkbookSource.dailyObservations;
  else if (window.CogSourceDailyObservations?.length) dailyObservations = window.CogSourceDailyObservations;
  if (window.CogSourceSteamDaily) dailyObservations.forEach((row) => {
    const steam = window.CogSourceSteamDaily[row.period] || {};
    Object.assign(row.metrics, {
      steamM01: steam.KPI_U04_STEAM_M01,
      steamM02: steam.KPI_U04_STEAM_M02,
      steamM03: steam.KPI_U04_STEAM_M03,
      steamM04: steam.KPI_U04_STEAM_M04,
      steamM05: steam.KPI_U04_STEAM_M05,
      steamM06: steam.KPI_U04_STEAM_M06,
    });
  });
  // Keep total steam usage and M01~M06 steam flows on the shared steam display
  // unit (t/h) across KPI, process and cost-impact screens.
  const legacyDailyTotals = new Map((window.CogSourceDailyObservations || []).map((row) => [row.period, row.metrics?.steamUsage]));
  dailyObservations.forEach((row) => {
    const modules = ['steamM01', 'steamM02', 'steamM03', 'steamM04', 'steamM05', 'steamM06'].map((id) => row.metrics?.[id]);
    if (modules.every((value) => Number.isFinite(value))) row.metrics.steamUsage = +modules.reduce((sum, value) => sum + value, 0).toFixed(6);
    else if (Number.isFinite(legacyDailyTotals.get(row.period))) row.metrics.steamUsage = legacyDailyTotals.get(row.period);
  });

  // The shared display unit for steam is t/h. The workbook source stores the
  // corresponding steam flow at one-tenth of the approved display scale, so
  // scale every steam observation consistently before any screen aggregates it.
  const steamMetricIds = ['steamUsage', 'steamM01', 'steamM02', 'steamM03', 'steamM04', 'steamM05', 'steamM06'];
  dailyObservations.forEach((row) => steamMetricIds.forEach((metricId) => {
    if (Number.isFinite(row.metrics?.[metricId])) row.metrics[metricId] = +(row.metrics[metricId] * 10).toFixed(6);
  }));

  const scaleIndexedRow = (row, factors, predicate) => {
    const values = Object.values(row);
    if (!predicate(values)) return row;
    const keys = Object.keys(row);
    const next = { ...row };
    Object.entries(factors).forEach(([index, factor]) => {
      const key = keys[Number(index)];
      const value = Number(next[key]);
      if (key && Number.isFinite(value)) next[key] = +(value * factor).toFixed(6);
    });
    return next;
  };
  const scaleSteamMonthlyRows = (rows) => (rows || []).map((row) => scaleIndexedRow(row, { 3: 10, 4: 10, 5: 10, 6: 0.1, 7: 0.1 }, (values) => Number(values[6]) >= 1000000));
  const scaleSteamEventRows = (rows) => (rows || []).map((row) => scaleIndexedRow(row, { 4: 10, 5: 0.1, 6: 0.1 }, (values) => Number(values[5]) >= 1000000));
  const scaleSteamRateRows = (rows) => (rows || []).map((row) => scaleIndexedRow(row, { 2: 0.1, 4: 0.1 }, (values) => Number(values[2]) >= 1000000));
  const scaledHourlyCostObservations = (window.CogWorkbookSource?.hourlyCostObservations || window.CogRawCostObservations || []).map((row) => ({
    ...row,
    steamUsage: Number.isFinite(Number(row.steamUsage)) ? +(Number(row.steamUsage) * 10).toFixed(6) : row.steamUsage,
  }));
  const scaledMonthlyCostImpacts = scaleSteamMonthlyRows(window.CogWorkbookSource?.monthlyCostImpacts || []);
  const scaledEventCostImpacts = scaleSteamEventRows(window.CogWorkbookSource?.eventCostImpacts || []);
  const scaledCostRates = scaleSteamRateRows(window.CogWorkbookSource?.costRates || []);

  const costSeeds = {
    '자재비 절감': { actual: [4.1, 4.6, 3.8, 5.1, 5.7, 4.9, 6.3, 6.8, 5.4, 4.7, 5.0, 6.2], baseline: [3.6, 3.8, 4.0, 4.1, 4.5, 4.4, 4.8, 5.0, 4.9, 4.5, 4.6, 5.0], targetUsage: 480 },
    '유틸리티 절감': { actual: [2.0, 2.5, 1.9, 3.2, 2.8, 3.5, 4.0, 3.7, 2.6, 2.2, 2.9, 3.6], baseline: [2.2, 2.4, 2.3, 2.7, 2.9, 3.0, 3.2, 3.3, 3.0, 2.8, 2.9, 3.1], targetUsage: 1000 },
    '생산량 증대 영향': { actual: [5.2, 6.0, 4.8, 6.7, 8.1, 5.3, 6.4, 8.8, -1.4, 2.1, 6.3, 7.4], baseline: [4.8, 5.2, 5.0, 5.5, 6.4, 5.8, 6.0, 7.0, 3.0, 3.5, 5.7, 6.2], targetUsage: 1042 },
  };
  const costRecords = Object.entries(costSeeds).flatMap(([costItem, seed]) => seed.actual.map((actualProfitImpact, index) => {
    const baselineProfitImpact = seed.baseline[index];
    return {
      period: `2025-${String(index + 1).padStart(2, '0')}`,
      plant: '화성공장',
      process: 'COG 정제공정',
      product: 'COG',
      costItem,
      actualProfitImpact,
      baselineProfitImpact,
      variance: +(actualProfitImpact - baselineProfitImpact).toFixed(1),
      targetUsage: seed.targetUsage,
      plannedUsage: seed.targetUsage,
      actualUsage: +(seed.targetUsage * (1 + (baselineProfitImpact - actualProfitImpact) / 100)).toFixed(1),
      unit: '백만원',
    };
  }));

  let events = [
    { id: 'EX02', name: '가스 출구온도 상승', startAt: '2025-08-18T07:00:00', endAt: '2025-08-20T07:00:00', impactedMetrics: ['gasOutletTemp', 'steamUsage'], priority: '중간' },
    { id: 'EX03', name: '약품 A 투입량 증가', startAt: '2025-08-25T07:00:00', endAt: '2025-08-27T07:00:00', impactedMetrics: ['chemicalA'], priority: '높음' },
    { id: 'EX07', name: '품질함량 상승', startAt: '2025-09-08T07:00:00', endAt: '2025-09-12T07:00:00', impactedMetrics: ['qualityContent', 'steamM01M04', 'gasOutletTemp'], priority: '높음' },
  ];
  if (window.CogWorkbookSource?.events?.length) events = window.CogWorkbookSource.events;

  window.CogMockData = {
    metadata: { referenceAt: '2025-12-31T07:00:00', defaultPlant: '화성공장', defaultProcess: 'COG 정제공정', defaultProduct: 'COG', currencyUnit: '백만원' },
    dimensions: { plants: ['화성공장'], processes: ['COG 정제공정'], products: ['COG'] },
    metricDefinitions,
    standards,
    dailyObservations,
    costObservations: scaledHourlyCostObservations,
    costTargets: window.CogRawCostTargets || {},
    monthlyCostImpacts: scaledMonthlyCostImpacts,
    eventCostImpacts: scaledEventCostImpacts,
    costRates: scaledCostRates,
    dailyStatuses: window.CogWorkbookSource?.dailyStatuses || [],
    costRecords,
    events,
  };
}());
