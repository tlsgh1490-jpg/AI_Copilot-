(function () {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  let requestedMetric = 'qualityContent';
  let latestRequest = 0;

  async function refreshCopilot() {
    const state = window.CogUiState;
    const copilot = document.querySelector('#brief .copilot');
    if (!state || !copilot || !window.fetch) return;
    const requestId = ++latestRequest;
    const query = new URLSearchParams({ start: state.start.slice(0, 10), end: state.end.slice(0, 10), metric: requestedMetric });
    try {
      const response = await fetch(`/api/copilot?${query}`);
      if (!response.ok) return;
      const result = await response.json();
      if (requestId !== latestRequest) return;
      const analysis = result.analysis;
      const issue = copilot.querySelector('.copilot-grid > div:first-child');
      const evidence = copilot.querySelector('.copilot-grid > div:last-child');
      if (!analysis.target || !issue || !evidence) return;
      const candidates = analysis.candidates || [];
      const candidateList = candidates.length
        ? `<ol>${candidates.slice(0, 3).map((item) => `<li>${escapeHtml(item.label)}: ${escapeHtml(item.reason)} · 상관계수 ${escapeHtml(item.correlation)}</li>`).join('')}</ol>`
        : `<p>${escapeHtml(analysis.limitation)}</p>`;
      issue.innerHTML = `<h3>주요 핵심 이슈</h3><p>${escapeHtml(analysis.target.label)} 최신값 ${escapeHtml(analysis.target.value)}${escapeHtml(analysis.target.unit)} · 상태 ${escapeHtml(analysis.status)}</p><div class="inline-standard"><span>현재값 <b>${escapeHtml(analysis.target.value)}${escapeHtml(analysis.target.unit)}</b></span><span>기준 대비 <b class="red-text">${escapeHtml(analysis.target.variance ?? '-')}</b></span></div><h3>Copilot 분석</h3><p>${escapeHtml(result.narrative)}</p><p class="disclaimer">데이터 기반 점검 우선순위이며 확정 원인이 아닙니다.</p>`;
      evidence.innerHTML = `<h3>점검 우선순위</h3>${candidateList}<h3>분석 기준</h3><p>조회 기간의 관리기준, 변화량, 설정된 변수 관계와 실제 상관계수를 함께 사용했습니다.${result.cached ? ' 동일 조건의 기존 분석을 재사용했습니다.' : ''}</p>`;
    } catch (_) {
      // Static file로 열었을 때는 기존 화면 문구를 그대로 유지한다.
    }
  }

  const originalRefresh = window.refreshDataDrivenViews;
  window.refreshDataDrivenViews = function () {
    const result = originalRefresh.apply(this, arguments);
    refreshCopilot();
    return result;
  };
  document.querySelectorAll('#brief .topic-chips button').forEach((button, index) => {
    button.addEventListener('click', () => {
      requestedMetric = ['qualityContent', 'steamUsage', 'gasOutletTemp'][index] || 'qualityContent';
      refreshCopilot();
    });
  });
  refreshCopilot();
}());
