const assert = require('node:assert/strict');
const test = require('node:test');
const { createCopilotHandler } = require('./copilot');

function responseCapture() {
  const result = { statusCode: 200, headers: {}, body: '' };
  return {
    ...result,
    setHeader(key, value) { this.headers[key] = value; },
    end(value) { this.body = value; },
  };
}

test('Vercel Copilot API returns a generated Brief without local SQLite storage', async () => {
  const handler = createCopilotHandler({
    source: {
      dailyObservations: [
        { period: '2025-09-10', metrics: { qualityContent: 0.79, steamM01: 2.4 } },
        { period: '2025-09-11', metrics: { qualityContent: 0.80, steamM01: 2.3 } },
      ],
      standards: [{ metricId: 'qualityContent', effectiveFrom: '2025-01-01', normalMax: 0.75, warningMax: 0.77 }],
      metricDefinitions: [{ id: 'qualityContent', label: '품질함량', unit: 'g/Nm³', decimals: 3 }, { id: 'steamM01', label: '스팀 M01', unit: 't/h', decimals: 2 }],
    },
    relationships: [{ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse' }],
    generateNarrative: async () => '{"예상원인":"스팀 변동 점검","영향KPI":"품질함량","점검우선순위":"스팀 M01 확인","brief_summary":"[이상] 점검 필요"}',
  });
  const response = responseCapture();
  await handler({ method: 'GET', query: { start: '2025-09-10', end: '2025-09-11', metric: 'qualityContent' } }, response);
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(body.briefSource, 'nvidia');
  assert.equal(body.narrative, '[이상] 점검 필요');
  assert.ok(body.analysis.target);
});
