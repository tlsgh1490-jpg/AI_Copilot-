const assert = require('node:assert/strict');
const test = require('node:test');
const { analyzePeriod } = require('./copilot-analysis');

test('ranks the variable with the strongest aligned change as the check candidate', () => {
  const result = analyzePeriod({
    observations: [
      { period: '2026-01-01', metrics: { qualityContent: 0.70, steamM01: 10, gasOutletTemp: 60 } },
      { period: '2026-01-02', metrics: { qualityContent: 0.71, steamM01: 9, gasOutletTemp: 60 } },
      { period: '2026-01-03', metrics: { qualityContent: 0.73, steamM01: 7, gasOutletTemp: 61 } },
    ],
    standards: [{ metricId: 'qualityContent', normalMax: 0.72, warningMax: 0.725, target: 0.70 }],
    definitions: [
      { id: 'qualityContent', label: '품질함량', unit: '%' },
      { id: 'steamM01', label: '스팀 M01', unit: 't/h' },
      { id: 'gasOutletTemp', label: '가스 출구온도', unit: '℃' },
    ],
    targetMetricId: 'qualityContent',
    relationships: [{ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse', weight: 1 }],
  });

  assert.equal(result.status, 'normal');
  assert.equal(result.candidates[0].metricId, 'steamM01');
  assert.ok(result.candidates[0].correlation < -0.9);
  assert.match(result.candidates[0].reason, /감소/);
});

test('does not invent a candidate when no configured relationship has changed', () => {
  const result = analyzePeriod({
    observations: [{ period: '2026-01-01', metrics: { qualityContent: 0.73, steamM01: 10 } }],
    standards: [{ metricId: 'qualityContent', normalMax: 0.72, warningMax: 0.725, target: 0.70 }],
    definitions: [{ id: 'qualityContent', label: '품질함량', unit: '%' }, { id: 'steamM01', label: '스팀 M01', unit: 't/h' }],
    targetMetricId: 'qualityContent',
    relationships: [{ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse', weight: 1 }],
  });

  assert.equal(result.candidates.length, 0);
  assert.match(result.limitation, /특정하기 어렵/);
});

test('uses the management standard effective on the latest analysis date', () => {
  const result = analyzePeriod({
    observations: [{ period: '2026-01-01', metrics: { qualityContent: 0.73 } }],
    standards: [
      { metricId: 'qualityContent', effectiveFrom: '2026-01-01', normalMax: 0.72, warningMax: 0.725 },
      { metricId: 'qualityContent', effectiveFrom: '2025-01-01', normalMax: 0.75, warningMax: 0.76 },
    ],
    definitions: [{ id: 'qualityContent', label: '품질함량', unit: '%' }],
    targetMetricId: 'qualityContent', relationships: [],
  });
  assert.equal(result.status, 'abnormal');
  assert.equal(result.standard.effectiveFrom, '2026-01-01');
});

test('evaluates the selected period with the same average KPI value shown on screen', () => {
  const result = analyzePeriod({
    observations: [
      { period: '2026-01-01', metrics: { qualityContent: 0.80 } },
      { period: '2026-01-02', metrics: { qualityContent: 0.70 } },
    ],
    standards: [{ metricId: 'qualityContent', normalMax: 0.74, warningMax: 0.76, target: 0.72 }],
    definitions: [{ id: 'qualityContent', label: '품질함량', unit: '%' }],
    targetMetricId: 'qualityContent', relationships: [],
  });
  assert.equal(result.target.value, 0.75);
  assert.equal(result.status, 'warning');
});

test('formats a steam candidate change using the approved module precision', () => {
  const result = analyzePeriod({
    observations: [
      { period: '2026-01-01', metrics: { qualityContent: 0.70, steamM01: 2.495 } },
      { period: '2026-01-02', metrics: { qualityContent: 0.71, steamM01: 2.432 } },
    ],
    standards: [{ metricId: 'qualityContent', normalMax: 0.72, warningMax: 0.725, target: 0.70 }],
    definitions: [
      { id: 'qualityContent', label: '품질함량', unit: 'g/Nm³', decimals: 3 },
      { id: 'steamM01', label: '스팀 M01', unit: 't/h', decimals: 2 },
    ],
    targetMetricId: 'qualityContent',
    relationships: [{ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse', weight: 1 }],
  });
  assert.match(result.candidates[0].reason, /-0\.06t\/h/);
  assert.doesNotMatch(result.candidates[0].reason, /-0\.063/);
});
