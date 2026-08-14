const assert = require('node:assert/strict');
const test = require('node:test');
const { createMcpHandler } = require('./mcp-server');

test('exposes analysis and data-management tools through MCP', async () => {
  const runtime = {
    service: { analyze: async () => ({ analysis: { status: 'normal' }, narrative: '설명' }) },
    store: {
      standards: () => [{ metricId: 'qualityContent' }],
      observations: () => [{ period: '2026-01-01', metrics: {} }],
      upsertObservation: () => {},
      upsertStandard: () => {},
      versions: () => ({ data_version: 2, standards_version: 3 }),
    },
  };
  const handler = createMcpHandler(runtime);
  const list = await handler({ method: 'tools/list' });
  assert.ok(list.tools.some((item) => item.name === 'upsert_observation'));
  const result = await handler({ method: 'tools/call', params: { name: 'upsert_observation', arguments: { period: '2026-01-02', metrics: { qualityContent: 0.7 } } } });
  assert.match(result.content[0].text, /data_version/);
});
