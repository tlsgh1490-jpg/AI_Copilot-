const requiredKeys = ['예상원인', '영향KPI', '점검우선순위', 'brief_summary'];

function stripMarkdownFence(value) {
  return String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseBriefJson(text) {
  try {
    const parsed = JSON.parse(stripMarkdownFence(text));
    if (!parsed || typeof parsed !== 'object') return null;
    const normalized = Object.fromEntries(requiredKeys.map((key) => {
      const value = parsed[key];
      const textValue = Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).join(', ') : value;
      return [key, typeof textValue === 'string' ? textValue.trim() : null];
    }));
    return requiredKeys.every((key) => normalized[key]) ? normalized : null;
  } catch {
    return null;
  }
}

function fallbackBrief(analysis) {
  const target = analysis.target || {};
  const candidates = analysis.candidates || [];
  const names = candidates.slice(0, 2).map((candidate) => candidate.label).join(', ');
  const status = analysis.status === 'normal' ? '정상' : analysis.status === 'warning' ? '주의' : '이상';
  if (analysis.status === 'normal') {
    return {
      예상원인: '관리기준 이탈이 확인되지 않아 특정 원인 후보를 제시하지 않습니다.',
      영향KPI: target.label || '조회 지표',
      점검우선순위: '다음 데이터 유입 시 동일 관리기준으로 추이를 계속 확인합니다.',
      brief_summary: '[정상] 선택 기간의 최신 값이 현재 관리기준 안에 있습니다.',
    };
  }
  if (!names) {
    return {
      예상원인: '연결된 관계 데이터가 부족하여 원인 후보를 특정할 수 없습니다.',
      영향KPI: target.label || '조회 지표',
      점검우선순위: '관리기준 이탈 여부와 원본 공정 데이터를 먼저 점검합니다.',
      brief_summary: `[${status}] 관리기준 이탈이 확인되어 현장 점검이 필요합니다.`,
    };
  }
  return {
    예상원인: `${names} 변동은 계산상 점검 후보이며 확정 원인이 아닙니다.`,
    영향KPI: target.label || '조회 지표',
    점검우선순위: `${names}의 실제 운전값과 설비 상태를 우선 점검합니다.`,
    brief_summary: `[${status}] ${target.label || '조회 지표'} 관리기준 이탈이 확인되어 ${names}을(를) 우선 점검 후보로 제시합니다.`,
  };
}

module.exports = { fallbackBrief, parseBriefJson };
