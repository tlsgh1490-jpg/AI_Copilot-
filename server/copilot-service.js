const { analyzePeriod } = require('./copilot-analysis');

function fallbackNarrative(analysis) {
  if (analysis.status === 'normal') return '선택 기간의 최신 값은 현재 관리기준 안에 있습니다. 계속 추이를 확인하세요.';
  if (!analysis.candidates.length) return `${analysis.limitation} 관리기준 이탈 여부와 원본 데이터를 우선 확인하세요.`;
  const names = analysis.candidates.slice(0, 2).map((item) => item.label).join(', ');
  return `관리기준 이탈이 확인되었습니다. ${names}을(를) 우선 점검 후보로 제시합니다. 이는 데이터 기반 점검 우선순위이며 확정 원인은 아닙니다.`;
}

function createCopilotService({ store, definitions, relationships, generateNarrative = async (analysis) => fallbackNarrative(analysis) }) {
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
    const narrative = await generateNarrative(analysis);
    const result = { analysis, narrative, cached: false, versions };
    store.putCached(cacheKey, versions, result);
    return result;
  }
  return { analyze, fallbackNarrative };
}

module.exports = { createCopilotService, fallbackNarrative };
