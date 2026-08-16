const assert = require('node:assert/strict');
const test = require('node:test');
const { createCopilotService } = require('./copilot-service');

function storeForTest(cache = new Map()) {
  return {
    versions: () => ({ data_version: 1, standards_version: 1 }),
    observations: () => [
      { period: '2026-01-01', metrics: { qualityContent: 0.70, steamM01: 10 } },
      { period: '2026-01-02', metrics: { qualityContent: 0.73, steamM01: 8 } },
    ],
    standards: () => [{ metricId: 'qualityContent', normalMax: 0.72, warningMax: 0.725, target: 0.70 }],
    getCached: (key) => cache.get(key) || null,
    putCached: (key, versions, result) => cache.set(key, result),
  };
}

function options(store, generateNarrative) {
  return {
    store,
    definitions: [{ id: 'qualityContent', label: '품질함량', unit: '%' }, { id: 'steamM01', label: '스팀 M01', unit: 't/h' }],
    relationships: [{ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse', weight: 0.8 }],
    generateNarrative,
  };
}

test('uses the cached NVIDIA Brief for the same period and data version', async () => {
  let calls = 0;
  const service = createCopilotService(options(storeForTest(), async () => {
    calls += 1;
    return '{"예상원인":"스팀 변동 확인 필요","영향KPI":"품질함량","점검우선순위":"스팀 M01 점검","brief_summary":"[이상] 점검 필요"}';
  }));
  const first = await service.analyze({ start: '2026-01-01', end: '2026-01-02', targetMetricId: 'qualityContent' });
  const second = await service.analyze({ start: '2026-01-01', end: '2026-01-02', targetMetricId: 'qualityContent' });
  assert.equal(first.narrative, '[이상] 점검 필요');
  assert.equal(first.narrativeSource, 'nvidia');
  assert.equal(first.brief.예상원인, '스팀 변동 확인 필요');
  assert.equal(first.briefSource, 'nvidia');
  assert.equal(second.cached, true);
  assert.equal(calls, 1);
});

test('uses a calculation Brief when the generated response is not valid JSON', async () => {
  const service = createCopilotService(options(storeForTest(), async () => '형식이 아닌 설명'));
  const result = await service.analyze({ targetMetricId: 'qualityContent' });
  assert.equal(result.briefSource, 'calculation');
  assert.equal(result.narrativeSource, 'calculation');
  assert.equal(typeof result.brief.점검우선순위, 'string');
});
