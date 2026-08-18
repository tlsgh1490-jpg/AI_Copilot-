const path = require('node:path');
const { loadCurrentFrontendData } = require('../server/data-source');
const { analyzePeriod } = require('../server/copilot-analysis');
const { fallbackBrief, parseBriefJson } = require('../server/brief-narrative');
const { createNvidiaNarrativeGenerator } = require('../server/nvidia-narrative');

const defaultRelationships = [
  ...['steamM01', 'steamM02', 'steamM03', 'steamM04'].map((candidateMetricId) => ({ targetMetricId: 'qualityContent', candidateMetricId, direction: 'inverse' })),
  ...['steamM01', 'steamM02', 'steamM03', 'steamM04', 'steamM05', 'steamM06'].map((candidateMetricId) => ({ targetMetricId: 'steamUsage', candidateMetricId, direction: 'increase' })),
];

let cachedSource;
function currentSource() {
  if (!cachedSource) cachedSource = loadCurrentFrontendData(path.resolve(__dirname, '..'));
  return cachedSource;
}

function writeJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function inPeriod(period, start, end) {
  const date = String(period || '').slice(0, 10);
  return (!start || date >= String(start).slice(0, 10)) && (!end || date <= String(end).slice(0, 10));
}

function createCopilotHandler({ source = currentSource(), relationships = defaultRelationships, generateNarrative = createNvidiaNarrativeGenerator({}) } = {}) {
  return async (request, response) => {
    if (request.method && request.method !== 'GET') return writeJson(response, 405, { error: 'Method not allowed' });
    try {
      const query = request.query || {};
      const targetMetricId = query.metric || 'qualityContent';
      const analysis = analyzePeriod({
        observations: source.dailyObservations.filter((item) => inPeriod(item.period, query.start, query.end)),
        standards: source.standards,
        definitions: source.metricDefinitions,
        targetMetricId,
        relationships: relationships.filter((item) => item.targetMetricId === targetMetricId),
      });
      let brief = fallbackBrief(analysis);
      let briefSource = 'calculation';
      try {
        const generated = await generateNarrative(analysis, { timeoutMs: 25000 });
        const parsed = parseBriefJson(typeof generated === 'string' ? generated : generated?.text);
        if (parsed) {
          brief = parsed;
          briefSource = generated?.source || 'nvidia';
        }
      } catch {
        // NVIDIA 호출 실패 시 계산 기반 Brief를 그대로 사용한다.
      }
      return writeJson(response, 200, {
        analysis,
        brief,
        briefSource,
        narrative: brief.brief_summary,
        narrativeSource: briefSource,
        cached: false,
        versions: { data: 'public-seed', standards: 'public-seed' },
      });
    } catch (error) {
      return writeJson(response, 500, { error: error.message || 'Copilot analysis failed' });
    }
  };
}

const handler = createCopilotHandler();
module.exports = handler;
module.exports.createCopilotHandler = createCopilotHandler;
