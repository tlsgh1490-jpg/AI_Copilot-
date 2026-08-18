const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApplication } = require('./server');

function getJson(port, endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${endpoint}`, (response) => {
      let text = '';
      response.on('data', (chunk) => { text += chunk; });
      response.on('end', () => resolve(JSON.parse(text)));
    }).on('error', reject);
  });
}

test('returns a validated Brief through the Copilot API', async () => {
  const app = createApplication({ generateNarrative: async () => '{"예상원인":"점검 후보","영향KPI":"품질함량","점검우선순위":"현장 확인","brief_summary":"[이상] 점검"}', databasePath: ':memory:' });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const body = await getJson(app.address().port, '/api/copilot?start=2025-09-08&end=2025-09-12');
    assert.equal(body.narrative, '[이상] 점검');
    assert.equal(body.briefSource, 'nvidia');
    assert.equal(typeof body.brief.점검우선순위, 'string');
    assert.ok(body.analysis.target);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test('accepts operating-data input and exposes it through the API', async () => {
  const app = createApplication({ generateNarrative: async () => null, databasePath: ':memory:' });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = app.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/observations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period: '2026-12-31', metrics: { qualityContent: 0.71 } }) });
    assert.equal(response.status, 201);
    const observations = await (await fetch(`http://127.0.0.1:${port}/api/observations?start=2026-12-31&end=2026-12-31`)).json();
    assert.equal(observations[0].period, '2026-12-31');
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test('does not cache frontend assets so a refresh receives the latest dashboard', async () => {
  const app = createApplication({ generateNarrative: async () => null, databasePath: ':memory:' });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${app.address().port}/app.js`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});
