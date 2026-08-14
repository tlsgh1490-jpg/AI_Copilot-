const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApplication } = require('./server');

test('returns calculated Copilot analysis through the API without requiring an LLM call', async () => {
  const app = createApplication({ generateNarrative: async () => '테스트 설명', databasePath: ':memory:' });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = app.address();
    const body = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/copilot?start=2025-09-08&end=2025-09-12`, (response) => {
        let text = '';
        response.on('data', (chunk) => { text += chunk; });
        response.on('end', () => resolve(JSON.parse(text)));
      }).on('error', reject);
    });
    assert.equal(body.narrative, '테스트 설명');
    assert.ok(body.analysis.target);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});
