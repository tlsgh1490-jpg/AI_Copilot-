const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { CopilotStore } = require('./copilot-store');
const { loadCurrentFrontendData } = require('./data-source');
const { createCopilotService, fallbackNarrative } = require('./copilot-service');
const { createNvidiaNarrativeGenerator } = require('./nvidia-narrative');

const projectRoot = path.resolve(__dirname, '..');
const defaultRelationships = ['steamM01', 'steamM02', 'steamM03', 'steamM04'].map((candidateMetricId) => ({ targetMetricId: 'qualityContent', candidateMetricId, direction: 'inverse' }));
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const narrativeTimeoutMs = Number(process.env.COPILOT_NARRATIVE_TIMEOUT_MS || 20000);

function createCopilotRuntime({ databasePath = path.join(__dirname, 'copilot.sqlite'), generateNarrative } = {}) {
  const source = loadCurrentFrontendData(projectRoot);
  const store = new CopilotStore(databasePath);
  store.seed({ observations: source.dailyObservations, standards: source.standards, relationships: defaultRelationships });
  const nvidiaGenerator = generateNarrative || createNvidiaNarrativeGenerator({ envFile: path.join(projectRoot, '.env') });
  const service = createCopilotService({
    store,
    definitions: source.metricDefinitions,
    relationships: (targetMetricId) => store.relationships(targetMetricId),
    generateNarrative: async (analysis) => {
      try { return await nvidiaGenerator(analysis, { timeoutMs: narrativeTimeoutMs }) || fallbackNarrative(analysis); } catch { return fallbackNarrative(analysis); }
    },
  });
  return { store, service };
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON body')); } });
    request.on('error', reject);
  });
}

function createApplication(options = {}) {
  const { store, service } = createCopilotRuntime(options);
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    try {
      if (request.method === 'GET' && url.pathname === '/api/copilot') {
        const result = await service.analyze({ start: url.searchParams.get('start'), end: url.searchParams.get('end'), targetMetricId: url.searchParams.get('metric') || 'qualityContent' });
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(result));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/standards') {
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(store.standards()));
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/observations') {
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(store.observations({ start: url.searchParams.get('start'), end: url.searchParams.get('end') })));
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/observations') {
        const observation = await readJson(request);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(observation.period || '') || !observation.metrics || typeof observation.metrics !== 'object') throw new Error('period and metrics are required');
        store.upsertObservation(observation);
        response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ versions: store.versions() }));
        return;
      }
      if (request.method === 'DELETE' && url.pathname.startsWith('/api/observations/')) {
        const period = decodeURIComponent(url.pathname.slice('/api/observations/'.length));
        response.writeHead(store.deleteObservation(period) ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ versions: store.versions() }));
        return;
      }
      if (request.method === 'PUT' && url.pathname.startsWith('/api/standards/')) {
        const standard = await readJson(request);
        const metricId = decodeURIComponent(url.pathname.slice('/api/standards/'.length));
        if (!metricId || standard.metricId !== metricId) throw new Error('metricId is required');
        store.upsertStandard(standard);
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ versions: store.versions() }));
        return;
      }
      if (request.method === 'DELETE' && url.pathname.startsWith('/api/standards/')) {
        const metricId = decodeURIComponent(url.pathname.slice('/api/standards/'.length));
        response.writeHead(store.deleteStandard(metricId, url.searchParams.get('effectiveFrom')) ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ versions: store.versions() }));
        return;
      }
      const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const filePath = path.resolve(projectRoot, 'frontend', relative);
      if (!filePath.startsWith(path.join(projectRoot, 'frontend')) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: error.message }));
    }
  });
  server.on('close', () => store.close());
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApplication().listen(port, () => console.log(`Copilot server: http://localhost:${port}`));
}

module.exports = { createApplication, createCopilotRuntime, defaultRelationships };
