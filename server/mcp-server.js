const path = require('node:path');
const { createCopilotRuntime } = require('./server');

const runtime = createCopilotRuntime({ databasePath: path.join(__dirname, 'copilot.sqlite') });
const tools = [
  {
    name: 'analyze_copilot_period',
    description: '선택 기간의 관리기준 이탈과 설정된 변수 관계를 분석해 점검 우선순위를 반환합니다.',
    inputSchema: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' }, targetMetricId: { type: 'string', default: 'qualityContent' } } },
  },
  {
    name: 'get_management_standards',
    description: '현재 DB에 저장된 관리기준을 반환합니다.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function handle(message) {
  if (message.method === 'initialize') return { protocolVersion: message.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'cog-copilot', version: '1.0.0' } };
  if (message.method === 'tools/list') return { tools };
  if (message.method === 'tools/call') {
    const args = message.params?.arguments || {};
    const result = message.params?.name === 'analyze_copilot_period'
      ? await runtime.service.analyze(args)
      : message.params?.name === 'get_management_standards'
        ? runtime.store.standards()
        : null;
    if (result === null) throw new Error('Unknown tool');
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
  return null;
}

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
