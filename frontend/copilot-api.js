(function () {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const formatMetric = (value, metricId, unit, signed = false) => window.CogMetricFormat?.value(value, metricId, unit, signed) ?? `${signed && Number(value) >= 0 ? '+' : ''}${value}${unit || ''}`;
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
      const occurrences = window.CogDataService?.getPeriodIssueOccurrences?.(state) || [];
      if (occurrences.length) {
        const records = occurrences.map((item) => {
          const start = item.start.slice(5).replace('-', '.');
          const end = item.end.slice(5).replace('-', '.');
          const period = start === end ? start : start + ' ~ ' + end;
          return item.label + ' ' + (item.status === 'abnormal' ? '이상' : '주의') + ' (' + period + ', ' + item.days + '일)';
        }).join(' · ');
        result.narrative += ' 기간 내 이탈 기록: ' + records + '.';
      }
      const issue = copilot.querySelector('.copilot-grid > div:first-child');
      const evidence = copilot.querySelector('.copilot-grid > div:last-child');
      if (!analysis.target || !issue || !evidence) return;
      const candidates = analysis.candidates || [];
      const candidateList = candidates.length
        ? `<ol>${candidates.slice(0, 3).map((item) => `<li>${escapeHtml(item.label)}: ${escapeHtml(item.reason)} · 상관계수 ${escapeHtml(item.correlation)}</li>`).join('')}</ol>`
        : `<p>${escapeHtml(analysis.limitation)}</p>`;
      const narrativeLabel = result.narrativeSource === 'nvidia' ? 'AI 설명' : '계산 기반 설명';
      const brief = result.brief || {};
      const briefDetails = brief.예상원인 && brief.영향KPI && brief.점검우선순위
        ? `<div class="copilot-brief-details"><h3>원인 후보</h3><p>${escapeHtml(brief.예상원인)}</p><h3>영향 KPI</h3><p>${escapeHtml(brief.영향KPI)}</p><h3>점검 우선순위</h3><p>${escapeHtml(brief.점검우선순위)}</p></div>`
        : '';
      const currentValue = formatMetric(analysis.target.value, analysis.target.metricId, analysis.target.unit);
      const variance = analysis.target.variance == null ? '-' : formatMetric(analysis.target.variance, analysis.target.metricId, analysis.target.unit, true);
      issue.innerHTML = `<h3>주요 이상 징후</h3><p>${escapeHtml(analysis.target.label)} 최신값 ${escapeHtml(currentValue)} · 상태 ${escapeHtml(analysis.status)}</p><div class="inline-standard"><span>현재값<b>${escapeHtml(currentValue)}</b></span><span>기준 대비<b class="red-text">${escapeHtml(variance)}</b></span></div><h3>${narrativeLabel}</h3><p>${escapeHtml(result.narrative)}</p>${briefDetails}<p class="disclaimer">데이터 기반 점검 우선순위이며 확정 원인은 아닙니다.</p>`;
      evidence.innerHTML = `<h3>점검 우선순위</h3>${candidateList}<h3>분석 기준</h3><p>조회 기간의 관리기준, 변화량, 설정된 변수 관계와 실제 상관계수를 함께 사용했습니다.${result.cached ? ' 동일 조건의 기존 분석을 재사용했습니다.' : ''}</p>`;
    } catch (_) {
      // 서버 없이 정적 파일로 열었을 때는 기존 화면 문구를 유지한다.
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
  window.addEventListener('copilot-metric', (event) => {
    requestedMetric = event.detail || 'qualityContent';
    refreshCopilot();
  });
  refreshCopilot();
}());
