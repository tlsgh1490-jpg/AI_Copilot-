const { analyzePeriod } = require('./copilot-analysis');
const { fallbackBrief, parseBriefJson } = require('./brief-narrative');

function fallbackNarrative(analysis) {
  return fallbackBrief(analysis).brief_summary;
}

function createCopilotService({ store, definitions, relationships, generateNarrative = async () => null }) {
  async function analyze({ start, end, targetMetricId = 'qualityContent' }) {
    const versions = store.versions();
    const cacheKey = JSON.stringify({ start: start || null, end: end || null, targetMetricId });
    const cached = store.getCached(cacheKey, versions);
    if (cached) return { ...cached, cached: true, versions };
    const analysis = analyzePeriod({
      observations: store.observations({ start, end }),
      standards: store.standards(),
      definitions,
      targetMetricId,
      relationships: typeof relationships === 'function' ? relationships(targetMetricId) : relationships,
    });
    let brief = fallbackBrief(analysis);
    let briefSource = 'calculation';
    try {
      const generated = await generateNarrative(analysis);
      const parsed = generated?.brief || parseBriefJson(typeof generated === 'string' ? generated : generated?.text);
      if (parsed) {
        brief = parsed;
        briefSource = generated?.source || 'nvidia';
      }
    } catch {
      // The calculated Brief remains available when an external call fails.
    }
    const result = {
      analysis,
      brief,
      briefSource,
      narrative: brief.brief_summary,
      narrativeSource: briefSource,
      cached: false,
      versions,
    };
    store.putCached(cacheKey, versions, result);
    return result;
  }
  return { analyze, fallbackNarrative };
}

module.exports = { createCopilotService, fallbackNarrative };
