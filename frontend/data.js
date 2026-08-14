(function () {
  const metricDefinitions = [
    { id: 'purifiedVolume', label: '정제량', unit: 'k Nm³', direction: 'range', decimals: 0 },
    { id: 'aUnit', label: 'A 생산원단위', unit: 'k', direction: 'upper', decimals: 1 },
    { id: 'bUnit', label: 'B 생산원단위', unit: 'k', direction: 'upper', decimals: 1 },
    { id: 'cUnit', label: 'C 생산원단위', unit: 'k', direction: 'upper', decimals: 1 },
    { id: 'chemicalA', label: '약품 A 원단위', unit: 'kg/t', direction: 'upper', decimals: 3 },
    { id: 'chemicalB', label: '약품 B 원단위', unit: 'kg/t', direction: 'upper', decimals: 3 },
    { id: 'steamUsage', label: '스팀 사용량', unit: 't', direction: 'range', decimals: 0 },
    { id: 'qualityContent', label: '품질함량', unit: '%', direction: 'upper', decimals: 3 },
    { id: 'gasOutletTemp', label: '가스 출구온도', unit: '℃', direction: 'range', decimals: 1 },
    { id: 'steamM01', label: '스팀 M01', unit: 't/h', direction: 'range', decimals: 3 },
    { id: 'steamM02', label: '스팀 M02', unit: 't/h', direction: 'range', decimals: 3 },
    { id: 'steamM03', label: '스팀 M03', unit: 't/h', direction: 'range', decimals: 3 },
    { id: 'steamM04', label: '스팀 M04', unit: 't/h', direction: 'range', decimals: 3 },
    { id: 'equipmentPressure', label: '설비 차압', unit: 'bar', direction: 'range', decimals: 1 },
    { id: 'gasFlow', label: '가스 유량', unit: 'Nm³/h', direction: 'range', decimals: 0 },
    { id: 'lgRatio', label: 'L/G비', unit: '', direction: 'range', decimals: 2 },
    { id: 'equipmentTemp', label: '설비온도', unit: '℃', direction: 'range', decimals: 1 },
    { id: 'oilFlow', label: '오일유량', unit: 'L/h', direction: 'range', decimals: 0 },
    { id: 'heatTransfer', label: '총괄열전달계수', unit: 'W/㎡K', direction: 'range', decimals: 1 },
    { id: 'gasPressure', label: '공정 압력', unit: 'bar', direction: 'range', decimals: 1 },
    { id: 'steamPressure', label: '스팀 압력', unit: 'bar', direction: 'range', decimals: 1 },
    { id: 'coolingWaterTemp', label: '냉각수 온도', unit: '℃', direction: 'range', decimals: 1 },
    { id: 'exhaustSpeed', label: '배기 흡입속도', unit: 'm³/h', direction: 'range', decimals: 0 },
  ];

  let standards = [
    { effectiveFrom: '2024-01-01', metricId: 'purifiedVolume', normalMin: 1012, normalMax: 1081, warningMin: 1000, warningMax: 1093, target: 1042 },
    { effectiveFrom: '2024-01-01', metricId: 'aUnit', normalMax: 16.0, warningMax: 16.4, target: 15.4 },
    { effectiveFrom: '2024-01-01', metricId: 'bUnit', normalMax: 11.1, warningMax: 11.4, target: 10.3 },
    { effectiveFrom: '2024-01-01', metricId: 'cUnit', normalMax: 7.2, warningMax: 7.4, target: 6.7 },
    { effectiveFrom: '2024-01-01', metricId: 'chemicalA', normalMax: 0.470, warningMax: 0.474, target: 0.472 },
    { effectiveFrom: '2024-01-01', metricId: 'chemicalB', normalMax: 0.405, warningMax: 0.412, target: 0.392 },
    { effectiveFrom: '2024-01-01', metricId: 'steamUsage', normalMin: 950, normalMax: 1080, warningMin: 930, warningMax: 1100, target: 1000 },
    { effectiveFrom: '2024-01-01', metricId: 'qualityContent', normalMax: 2.30, warningMax: 2.35, target: 2.14 },
    { effectiveFrom: '2024-01-01', metricId: 'gasOutletTemp', normalMin: 135, normalMax: 145, warningMin: 132, warningMax: 148, target: 140 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM01', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM02', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM03', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'steamM04', normalMin: 0.235, normalMax: 0.268, warningMin: 0.225, warningMax: 0.280, target: 0.250 },
    { effectiveFrom: '2024-01-01', metricId: 'equipmentPressure', normalMin: 59.4, normalMax: 63.5, warningMin: 58.5, warningMax: 64.5, target: 61.0 },
    { effectiveFrom: '2025-07-01', metricId: 'steamUsage', normalMin: 945, normalMax: 1075, warningMin: 925, warningMax: 1095, target: 995 },
    { effectiveFrom: '2024-01-01', metricId: 'gasFlow', normalMin: 4000, normalMax: 4600, warningMin: 3800, warningMax: 4800, target: 4300 },
    { effectiveFrom: '2024-01-01', metricId: 'lgRatio', normalMin: 1.40, normalMax: 1.55, warningMin: 1.35, warningMax: 1.60, target: 1.46 },
    { effectiveFrom: '2024-01-01', metricId: 'equipmentTemp', normalMin: 820, normalMax: 880, warningMin: 800, warningMax: 900, target: 850 },
    { effectiveFrom: '2024-01-01', metricId: 'oilFlow', normalMin: 110, normalMax: 150, warningMin: 100, warningMax: 160, target: 130 },
    { effectiveFrom: '2024-01-01', metricId: 'heatTransfer', normalMin: 45, normalMax: 65, warningMin: 40, warningMax: 70, target: 55 },
    { effectiveFrom: '2024-01-01', metricId: 'gasPressure', normalMin: 11, normalMax: 14, warningMin: 10, warningMax: 15, target: 12.4 },
    { effectiveFrom: '2024-01-01', metricId: 'steamPressure', normalMin: 7, normalMax: 10, warningMin: 6, warningMax: 11, target: 8.2 },
    { effectiveFrom: '2024-01-01', metricId: 'coolingWaterTemp', normalMin: 28, normalMax: 38, warningMin: 25, warningMax: 40, target: 32.5 },
    { effectiveFrom: '2024-01-01', metricId: 'exhaustSpeed', normalMin: 1200, normalMax: 1700, warningMin: 1100, warningMax: 1800, target: 1450 },
  ];
  if (window.CogSourceStandards?.length) standards = window.CogSourceStandards;
  const steamAverageStandards = standards.filter((standard) => standard.metricId === 'steamM01M04');
  if (steamAverageStandards.length) {
    standards = standards.filter((standard) => standard.metricId !== 'steamM01M04');
    ['steamM01', 'steamM02', 'steamM03', 'steamM04'].forEach((metricId) => steamAverageStandards.forEach((standard) => standards.push({ ...standard, metricId })));
  }

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
    });
  });

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
    costObservations: window.CogWorkbookSource?.hourlyCostObservations || window.CogRawCostObservations || [],
    costTargets: window.CogRawCostTargets || {},
    monthlyCostImpacts: window.CogWorkbookSource?.monthlyCostImpacts || [],
    eventCostImpacts: window.CogWorkbookSource?.eventCostImpacts || [],
    costRates: window.CogWorkbookSource?.costRates || [],
    dailyStatuses: window.CogWorkbookSource?.dailyStatuses || [],
    costRecords,
    events,
  };
}());
