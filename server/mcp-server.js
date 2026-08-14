const path = require('node:path');
const { createCopilotRuntime } = require('./server');

const tools = [
  { name: 'analyze_copilot_period', description: 'Analyze a selected period and return data-based inspection priorities.', inputSchema: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' }, targetMetricId: { type: 'string', default: 'qualityContent' } } } },
  { name: 'get_management_standards', description: 'Return the current management standards from the database.', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_observations', description: 'Return stored operating data for an optional period.', inputSchema: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } } } },
  { name: 'upsert_observation', description: 'Add or replace one day of operating data. This changes the data version and refreshes subsequent analysis.', inputSchema: { type: 'object', required: ['period', 'metrics'], properties: { period: { type: 'string' }, metrics: { type: 'object' } } } },
  { name: 'delete_observation', description: 'Delete one operating-data day by period.', inputSchema: { type: 'object', required: ['period'], properties: { period: { type: 'string' } } } },
  { name: 'upsert_management_standard', description: 'Add or replace one management standard. This changes the standards version and refreshes subsequent analysis.', inputSchema: { type: 'object', required: ['metricId'], properties: { metricId: { type: 'string' }, normalMin: { type: 'number' }, normalMax: { type: 'number' }, warningMin: { type: 'number' }, warningMax: { type: 'number' }, target: { type: 'number' } } } },
  { name: 'delete_management_standard', description: 'Delete one management standard by metric id.', inputSchema: { type: 'object', required: ['metricId'], properties: { metricId: { type: 'string' } } } },
];

function createMcpHandler(runtime) {
  return async (message) => {
    if (message.method === 'initialize') return { protocolVersion: message.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'cog-copilot', version: '1.0.0' } };
    if (message.method === 'tools/list') return { tools };
    if (message.method !== 'tools/call') return null;
    const args = message.params?.arguments || {};
    let result;
    switch (message.params?.name) {
      case 'analyze_copilot_period': result = await runtime.service.analyze(args); break;
      case 'get_management_standards': result = runtime.store.standards(); break;
      case 'get_observations': result = runtime.store.observations(args); break;
      case 'upsert_observation': runtime.store.upsertObservation(args); result = { versions: runtime.store.versions() }; break;
      case 'delete_observation': result = { deleted: runtime.store.deleteObservation(args.period), versions: runtime.store.versions() }; break;
      case 'upsert_management_standard': runtime.store.upsertStandard(args); result = { versions: runtime.store.versions() }; break;
      case 'delete_management_standard': result = { deleted: runtime.store.deleteStandard(args.metricId), versions: runtime.store.versions() }; break;
      default: throw new Error('Unknown tool');
    }
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  };
}

if (require.main === module) {
  const runtime = createCopilotRuntime({ databasePath: path.join(__dirname, 'copilot.sqlite') });
  const handle = createMcpHandler(runtime);
  let buffered = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buffered += chunk;
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop();
    for (const line of lines.filter(Boolean)) {
      try {
        const message = JSON.parse(line);
        const result = await handle(message);
        if (message.id !== undefined) process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: message.id, result })}\n`);
      } catch (error) {
        process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: error.message } })}\n`);
      }
    }
  });
}

module.exports = { createMcpHandler, tools };
