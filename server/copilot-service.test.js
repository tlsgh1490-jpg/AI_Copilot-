const assert = require('node:assert/strict');
const test = require('node:test');
const { createCopilotService } = require('./copilot-service');

test('uses the cached explanation for the same period and data version', async () => {
  let calls = 0;
  const cache = new Map();
  const store = {
    versions: () => ({ data_version: 1, standards_version: 1 }),
    observations: () => [
      { period: '2026-01-01', metrics: { qualityContent: 0.70, steamM01: 10 } },
      { period: '2026-01-02', metrics: { qualityContent: 0.73, steamM01: 8 } },
    ],
    standards: () => [{ metricId: 'qualityContent', normalMax: 0.72, warningMax: 0.725, target: 0.70 }],
    getCached: (key) => cache.get(key) || null,
    putCached: (key, versions, result) => cache.set(key, result),
  };
  const service = createCopilotService({
    store,
    definitions: [{ id: 'qualityContent', label: '품질함량', unit: '%' }, { id: 'steamM01', label: '스팀 M01', unit: 't/h' }],
    relationships: [{ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse', weight: 0.8 }],
    generateNarrative: async () => { calls += 1; return '생성된 설명'; },
  });

  const first = await service.analyze({ start: '2026-01-01', end: '2026-01-02', targetMetricId: 'qualityContent' });
  const second = await service.analyze({ start: '2026-01-01', end: '2026-01-02', targetMetricId: 'qualityContent' });
  assert.equal(first.narrative, '생성된 설명');
  assert.equal(first.narrativeSource, 'generated');
  assert.equal(second.cached, true);
  assert.equal(calls, 1);
});
