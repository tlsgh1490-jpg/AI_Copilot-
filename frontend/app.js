const views = [...document.querySelectorAll('.view')];
const navButtons = [...document.querySelectorAll('[data-view]')];
const sidebarNavButtons = [...document.querySelectorAll('.sidebar [data-view]')];
const crumb = document.querySelector('#crumb');
const labels = { overview: '통합 현황', brief: 'Brief & Copilot', diagnosis: '이상 진단', cost: '원가 영향', process: '공정 데이터 분석', standards: '기준 체계' };

document.querySelector('.topbar .top-meta')?.remove();

function showView(id) {
  views.forEach((view) => view.classList.toggle('active', view.id === id));
  sidebarNavButtons.forEach((button) => {
    const isIntegratedChild = ['brief', 'processOverview', 'diagnosis', 'cost'].includes(id);
    const isCurrentView = button.dataset.view === id;
    const isOverviewParent = isIntegratedChild && button.dataset.view === 'overview';
    button.classList.toggle('active', isCurrentView || isOverviewParent);
  });
  crumb.textContent = labels[id];
  if (window.refreshDataDrivenViews && ['brief', 'diagnosis', 'cost', 'standards'].includes(id)) window.refreshDataDrivenViews();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navButtons.forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));

const shiftCalendarDate = (value, days) => {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const operationalDateFromInput = (value, isEnd = false) => {
  const date = String(value || '').slice(0, 10);
  if (!isEnd || !String(value).includes('T')) return date;
  const hour = Number(String(value).slice(11, 13));
  return hour < 7 ? shiftCalendarDate(date, -1) : date;
};
const readPeriodRange = (container, inputs = [...container.querySelectorAll('[data-period-input]')]) => {
  const timeMode = Boolean(container.querySelector('[data-time-mode]')?.checked);
  if (timeMode) return { start: inputs[0]?.value || '', end: inputs[1]?.value || '', granularity: 'hour' };
  return { start: operationalDateFromInput(inputs[0]?.value), end: operationalDateFromInput(inputs[1]?.value, true), granularity: 'day' };
};
const installPeriodMode = (container, inputs = [...container.querySelectorAll('[data-period-input]')]) => {
  const toggle = container.querySelector('[data-time-mode]');
  if (!toggle || !inputs.length) return;
  const setMode = () => {
    const timeMode = toggle.checked;
    inputs.forEach((input, index) => {
      const isEnd = index % 2 === 1;
      const date = operationalDateFromInput(input.value, isEnd);
      input.type = timeMode ? 'datetime-local' : 'date';
      if (timeMode) input.value = `${isEnd ? shiftCalendarDate(date, 1) : date}T${isEnd ? '06:59' : '07:00'}`;
      else input.value = date;
    });
  };
  toggle.addEventListener('change', setMode);
  setMode();
};

document.querySelector('#standard-modal-button').addEventListener('click', () => document.querySelector('#standard-modal').showModal());

document.querySelectorAll('.topic-chips button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.topic-chips button').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
  });
});

const normalOverviewCard = document.querySelector('#overview .metric.normal');
if (normalOverviewCard) {
  normalOverviewCard.querySelector('.metric-kpis')?.remove();
  const normalKpiSummary = document.createElement('div');
  normalKpiSummary.className = 'normal-kpi-summary';
  const normalKpis = [
    ['\uc815\uc81c\ub7c9', '1,058k Nm³', '\uc815\uc0c1 1,012~1,081k · \ubaa9\ud45c +1.5%'],
    ['A \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '15.7k', '\ubaa9\ud45c \ub300\ube44 -1.9%'],
    ['B \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '10.4k', '\ubaa9\ud45c \ub300\ube44 -1.0%'],
    ['C \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '6.8k', '\ubaa9\ud45c \ub300\ube44 -1.4%'],
    ['\uc57d\ud488 B \uc6d0\ub2e8\uc704', '0.392 kg/t', '\uc815\uc0c1 \uc0c1\ud55c \ub300\ube44 -2.2%'],
    ['\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', '963t/h', '\uc815\uc0c1 950~1,080t/h · \ubaa9\ud45c -3.7%'],
  ];
  normalKpiSummary.innerHTML = normalKpis.map((kpi) => '<div><span>' + kpi[0] + '</span><b>' + kpi[1] + '</b><small>' + kpi[2] + '</small></div>').join('');
  normalOverviewCard.querySelector('b').insertAdjacentElement('afterend', normalKpiSummary);
}

const kpiCardDetailData = {
  normal: [
    ['\uc815\uc81c\ub7c9', '1,058k Nm³', '\uc815\uc0c1 1,012~1,081k · \ubaa9\ud45c +1.5%'],
    ['A \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '15.7k', '\ubaa9\ud45c \ub300\ube44 -1.9%'],
    ['B \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '10.4k', '\ubaa9\ud45c \ub300\ube44 -1.0%'],
    ['C \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '6.8k', '\ubaa9\ud45c \ub300\ube44 -1.4%'],
    ['\uc57d\ud488 B \uc6d0\ub2e8\uc704', '0.392 kg/t', '\uc815\uc0c1 \uc0c1\ud55c \ub300\ube44 -2.2%'],
    ['\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', '963t/h', '\uc815\uc0c1 950~1,080t/h · \ubaa9\ud45c -3.7%'],
  ],
  warning: [['\uc57d\ud488 A \uc6d0\ub2e8\uc704', '0.475 kg/t', '\uc8fc\uc758 \uc0c1\ud55c 0.474 kg/t \ub300\ube44 +0.2%']],
  danger: [['\ud488\uc9c8\ud568\ub7c9', '2.38%', '\uc774\uc0c1 \uae30\uc900 2.35% \ub300\ube44 +0.03%p']],
};
const renderKpiCardDetail = (items) => '<div class="kpi-card-detail">' + items.map((item) => '<div><span>' + item[0] + '</span><b>' + item[1] + '</b><small>' + item[2] + '</small></div>').join('') + '</div>';
document.querySelectorAll('#overview .metric-grid .metric').forEach((card) => {
  const type = card.classList.contains('warning') ? 'warning' : card.classList.contains('danger') ? 'danger' : card.classList.contains('normal') ? 'normal' : null;
  if (!type || !kpiCardDetailData[type]) return;
  const title = card.querySelector(':scope > span')?.textContent || '';
  const count = card.querySelector(':scope > b')?.textContent || '';
  card.innerHTML = '<span>' + title + '</span><b class="kpi-count">' + count + '</b>' + renderKpiCardDetail(kpiCardDetailData[type]);
});
const overviewMetricGrid = document.querySelector('#overview .metric-grid');
if (overviewMetricGrid) {
  const kpiStatusSummaryGrid = document.createElement('div');
  kpiStatusSummaryGrid.className = 'kpi-status-summary-grid';
  [...overviewMetricGrid.querySelectorAll('.metric.normal, .metric.warning, .metric.danger')].forEach((card) => kpiStatusSummaryGrid.appendChild(card));
  overviewMetricGrid.prepend(kpiStatusSummaryGrid);
  const warningCard = kpiStatusSummaryGrid.querySelector('.metric.warning');
  const dangerCard = kpiStatusSummaryGrid.querySelector('.metric.danger');
  const addKpiAlertNote = (card, rows) => {
    if (!card) return;
    const note = document.createElement('div');
    note.className = 'kpi-alert-note';
    note.innerHTML = rows.map((row) => '<span>' + row[0] + '<b>' + row[1] + '</b></span>').join('');
    card.appendChild(note);
  };
  addKpiAlertNote(warningCard, [['\uc8fc\uc758 \uc0c1\ud55c', '0.474 kg/t'], ['\uc774\ud0c8 \ud3ed', '+0.001 kg/t'], ['\ubaa9\ud45c \ub300\ube44', '+0.003 kg/t']]);
  addKpiAlertNote(dangerCard, [['\uc774\uc0c1 \uae30\uc900', '2.35%'], ['\uc774\ud0c8 \ud3ed', '+0.03%p'], ['\ubaa9\ud45c \ub300\ube44', '+0.24%p']]);
  const profitCard = overviewMetricGrid.querySelector('.metric.cost');
  if (profitCard) {
    profitCard.className = 'period-profit-summary';
    profitCard.innerHTML = '<div><span>\uc120\ud0dd \uae30\uac04 \uc190\uc775 \uc601\ud5a5</span><b>-12.4\ubc31\ub9cc\uc6d0</b><small>\ubaa9\ud45c \ub300\ube44 \uc0ac\uc6a9\ub7c9 \uc99d\uac10\uc5d0 \ub530\ub978 \uc21c\uc190\uc2e4</small></div><div class=\"profit-breakdown\"><span>\uac00\uc2a4 \uc0ac\uc6a9\ub7c9 <b>-10.2\ubc31\ub9cc\uc6d0</b><small>\ubaa9\ud45c \ub300\ube44 +2.6%</small></span><span>\uc57d\ud488 A \ud22c\uc785 <b>-8.2\ubc31\ub9cc\uc6d0</b><small>\ubaa9\ud45c \ub300\ube44 +3.6%</small></span><span>\uc2a4\ud300 \ud6a8\uc728 <b>+0.8\ubc31\ub9cc\uc6d0</b><small>\uae30\uc900 \ub300\ube44 \uc808\uac10</small></span></div><button class=\"outline\" data-view=\"cost\">\uc190\uc775 \uc601\ud5a5 \uc0c1\uc138 \ubcf4\uae30 \u2192</button>';
    profitCard.querySelector('[data-view=\"cost\"]').addEventListener('click', () => showView('cost'));
  }
}
document.querySelector('#overview .kpi-status-summary-grid')?.remove();
// Approved overview structure: KPI status is shown only in the expandable
// board below.  The top area retains the profit-impact summary, not KPI cards.
document.querySelectorAll('#overview .metric-grid > .metric.normal, #overview .metric-grid > .metric.warning, #overview .metric-grid > .metric.danger').forEach((card) => card.remove());
document.querySelector('#overview .kpi-status-board .status-summary')?.remove();
const overviewKpiBoard = document.querySelector('#overview .kpi-status-board');
if (overviewKpiBoard) {
  const kpiDetailRows = [
    ['\uc815\uc0c1', 'A \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '15.7k', '\uc815\uc0c1 \ubc94\uc704 15.1k ~ 16.3k', '\ubaa9\ud45c 16.0k \ub300\ube44 -1.9%', 'normal', 'M0 25 L35 23 L68 18 L100 21 L130 16 L160 17'],
    ['\uc815\uc0c1', 'B \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '10.4k', '\uc815\uc0c1 \ubc94\uc704 10.0k ~ 10.8k', '\ubaa9\ud45c 10.5k \ub300\ube44 -1.0%', 'normal', 'M0 21 L35 20 L68 22 L100 18 L130 17 L160 19'],
    ['\uc815\uc0c1', 'C \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '6.8k', '\uc815\uc0c1 \ubc94\uc704 6.5k ~ 7.1k', '\ubaa9\ud45c 6.9k \ub300\ube44 -1.4%', 'normal', 'M0 27 L35 24 L68 21 L100 20 L130 17 L160 18'],
    ['\uc815\uc0c1', '\uc57d\ud488 B \uc6d0\ub2e8\uc704', '0.392 kg/t', '\uc815\uc0c1 \uc0c1\ud55c 0.401 kg/t', '\ubaa9\ud45c 0.400 kg/t \ub300\ube44 -2.0%', 'normal', 'M0 18 L35 20 L68 19 L100 23 L130 22 L160 24'],
    ['\uc815\uc0c1', '\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', '963t/h', '\uc815\uc0c1 \ubc94\uc704 950 ~ 1,080t/h', '\ubaa9\ud45c 1,000t/h \ub300\ube44 -3.7%', 'normal', 'M0 14 L35 18 L68 17 L100 25 L130 29 L160 32'],
  ];
  const tbody = overviewKpiBoard.querySelector('tbody');
  kpiDetailRows.forEach((row) => {
    tbody.insertAdjacentHTML('beforeend', '<tr class=\"kpi-detail-row\" hidden><td><span class=\"status normal\">\u25cf ' + row[0] + '</span></td><td><b>' + row[1] + '</b></td><td class=\"positive\"><b>' + row[2] + '</b></td><td>' + row[3] + '</td><td>' + row[4] + '</td><td><svg class=\"table-trend ' + row[5] + '\" viewBox=\"0 0 160 42\"><rect x=\"0\" y=\"10\" width=\"160\" height=\"22\"/><path d=\"' + row[6] + '\"/></svg><small>\uc74c\uc601: \uc815\uc0c1 \ubc94\uc704</small></td></tr>');
  });
  const toggle = document.createElement('button');
  toggle.className = 'kpi-detail-toggle outline';
  toggle.textContent = '\uc804\uccb4 KPI \ud604\ud669 \ubcf4\uae30 (5\uac1c \ucd94\uac00)';
  overviewKpiBoard.appendChild(toggle);
  toggle.addEventListener('click', () => {
    const isExpanded = toggle.dataset.expanded === 'true';
    overviewKpiBoard.querySelectorAll('.kpi-detail-row').forEach((row) => { row.hidden = isExpanded; });
    toggle.dataset.expanded = String(!isExpanded);
    toggle.textContent = isExpanded ? '\uc804\uccb4 KPI \ud604\ud669 \ubcf4\uae30 (5\uac1c \ucd94\uac00)' : '\uc8fc\uc694 KPI\ub9cc \ubcf4\uae30';
  });
}
const briefTop = document.querySelector('#brief .brief-top');
if (briefTop) {
  const briefAlertKpis = document.createElement('section');
  briefAlertKpis.className = 'brief-alert-kpis';
  briefAlertKpis.innerHTML = '<div class="brief-alert-kpis-title">주의·이상 KPI 현황</div><div class="brief-alert-kpis-grid"><div class="brief-alert-group warning"><b>주의 KPI <em>0건</em></b><div class="brief-alert-items"></div></div><div class="brief-alert-group danger"><b>이상 KPI <em>0건</em></b><div class="brief-alert-items"></div></div></div>';
  briefTop.insertAdjacentElement('afterend', briefAlertKpis);
}
const briefFull = document.querySelector('#brief .brief-full');
if (briefFull) {
  briefFull.querySelector('.brief-kpi-status-details')?.remove();
  briefFull.querySelector('.metric-strip')?.remove();
  const briefTable = briefFull.querySelector('table');
  const briefTbody = briefTable?.querySelector('tbody');
  const satisfaction = document.createElement('div');
  satisfaction.className = 'brief-kpi-satisfaction';
  satisfaction.innerHTML = '<b>KPI \ub9cc\uc871 \ud604\ud669</b><span><strong>8\uac1c \uc911 6\uac1c \uc815\uc0c1</strong> · \uc8fc\uc758 1\uac1c(\uc57d\ud488 A \uc6d0\ub2e8\uc704) · \uc774\uc0c1 1\uac1c(\ud488\uc9c8\ud568\ub7c9)</span><em>\uc6b0\uc120 \uc870\uce58: \ud488\uc9c8\ud568\ub7c9 \uc774\uc0c1 \uc6d0\uc778 \uc810\uac80</em>';
  const briefProfit = document.createElement('section');
  briefProfit.className = 'period-profit-summary brief-profit-summary';
  briefProfit.innerHTML = '<div><span>\uc120\ud0dd \uae30\uac04 \uc190\uc775 \uc601\ud5a5</span><b>-12.4\ubc31\ub9cc\uc6d0</b><small>\ubaa9\ud45c \ub300\ube44 \uc0ac\uc6a9\ub7c9 \uc99d\uac10\uc5d0 \ub530\ub978 \uc21c\uc190\uc2e4</small></div><div class=\"profit-breakdown\"><span>\uac00\uc2a4 \uc0ac\uc6a9\ub7c9 <b>-10.2\ubc31\ub9cc\uc6d0</b><small>\ubaa9\ud45c \ub300\ube44 +2.6%</small></span><span>\uc57d\ud488 A \ud22c\uc785 <b>-8.2\ubc31\ub9cc\uc6d0</b><small>\ubaa9\ud45c \ub300\ube44 +3.6%</small></span><span>\uc2a4\ud300 \ud6a8\uc728 <b>+0.8\ubc31\ub9cc\uc6d0</b><small>\uae30\uc900 \ub300\ube44 \uc808\uac10</small></span></div><button class=\"outline\" data-view=\"cost\">\uc190\uc775 \uc601\ud5a5 \uc0c1\uc138 \ubcf4\uae30 \u2192</button>';
  briefTable.before(satisfaction, briefProfit);
  briefProfit.querySelector('[data-view=\"cost\"]').addEventListener('click', () => showView('cost'));
  const briefDetailRows = [
    ['A \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '15.7k', '\uc815\uc0c1 15.1~16.3k', '-1.9%', 'normal', 'M0 25 L30 23 L60 18 L92 21 L125 16 L160 17'],
    ['B \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '10.4k', '\uc815\uc0c1 10.0~10.8k', '-1.0%', 'normal', 'M0 21 L30 20 L60 22 L92 18 L125 17 L160 19'],
    ['C \uc0dd\uc0b0\uc6d0\ub2e8\uc704', '6.8k', '\uc815\uc0c1 6.5~7.1k', '-1.4%', 'normal', 'M0 27 L30 24 L60 21 L92 20 L125 17 L160 18'],
    ['\uc57d\ud488 A \uc6d0\ub2e8\uc704', '0.475 kg/t', '\uc8fc\uc758 \uc0c1\ud55c 0.474 kg/t \ucd08\uacfc', '+0.6%', 'warning', 'M0 30 L30 27 L60 25 L92 26 L125 17 L160 14'],
    ['\uc57d\ud488 B \uc6d0\ub2e8\uc704', '0.392 kg/t', '\uc815\uc0c1 \uc0c1\ud55c 0.401 kg/t', '-2.0%', 'normal', 'M0 18 L30 20 L60 19 L92 23 L125 22 L160 24'],
  ];
  briefDetailRows.forEach((row) => {
    briefTbody.insertAdjacentHTML('beforeend', '<tr class=\"brief-kpi-detail-row\" hidden><td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + '</td><td class=\"' + (row[4] === 'warning' ? 'orange' : 'positive') + '\">' + row[3] + '</td><td><svg class=\"table-trend ' + row[4] + '\" viewBox=\"0 0 160 42\"><rect x=\"0\" y=\"10\" width=\"160\" height=\"22\"/><path d=\"' + row[5] + '\"/></svg><small>\uc74c\uc601: \uc815\uc0c1 \ubc94\uc704</small></td></tr>');
  });
  const briefToggle = document.createElement('button');
  briefToggle.className = 'brief-kpi-detail-toggle outline';
  briefToggle.textContent = '\uc804\uccb4 KPI \ud604\ud669 \ubcf4\uae30 (5\uac1c \ucd94\uac00)';
  briefTable.insertAdjacentElement('afterend', briefToggle);
  briefToggle.addEventListener('click', () => {
    const isExpanded = briefToggle.dataset.expanded === 'true';
    briefFull.querySelectorAll('.brief-kpi-detail-row').forEach((row) => { row.hidden = isExpanded; });
    briefToggle.dataset.expanded = String(!isExpanded);
    briefToggle.textContent = isExpanded ? '\uc804\uccb4 KPI \ud604\ud669 \ubcf4\uae30 (5\uac1c \ucd94\uac00)' : '\uc8fc\uc694 KPI\ub9cc \ubcf4\uae30';
  });
}

const diagnosisTrendSummary = document.querySelector('#diagnosis .trend-summary');
if (diagnosisTrendSummary) {
  diagnosisTrendSummary.insertAdjacentHTML('beforebegin', `
    <section class="breach-summary" aria-label="\uc774\uc0c1 \ucd08\uacfc \uc694\uc57d">
      <div><span>\ucd08\uacfc \ud56d\ubaa9</span><b>\ud488\uc9c8\ud568\ub7c9</b><small>KPI_U04_CONTAIN_S01</small></div>
      <div><span>\ud604\uc7ac\uac12</span><b class="red-text">2.38%</b><small>\ubaa9\ud45c \ub300\ube44 +0.24%p</small></div>
      <div><span>\uc774\uc0c1 \uae30\uc900</span><b>2.35%</b><small>\uad00\ub9ac \uc0c1\ud55c \ucd08\uacfc</small></div>
      <div class="breach-amount"><span>\ucd08\uacfc \ud3ed</span><b>+0.03%p</b><small>\uc989\uc2dc \uc810\uac80 \ud544\uc694</small></div>
    </section>`);
}

const processResult = document.querySelector('#process .result');
if (processResult) {
  const resultHeaders = processResult.querySelectorAll('thead th');
  resultHeaders[1].textContent = '\uae30\uc900 \uae30\uac04 \uc2e4\uc801';
  resultHeaders[2].textContent = '\ube44\uad50 \uae30\uac04 \uc2e4\uc801';
  resultHeaders[resultHeaders.length - 1].textContent = '\ube44\uad50 \ucd94\uc774';
  const trendShapes = [
    { kind: 'danger', base: 'M2 34 L30 32 L58 29 L86 28 L114 24 L142 20', current: 'M2 37 L30 35 L58 36 L86 25 L114 13 L142 8' },
    { kind: 'positive', base: 'M2 14 L30 17 L58 18 L86 23 L114 27 L142 30', current: 'M2 12 L30 15 L58 19 L86 27 L114 31 L142 34' },
    { kind: 'warning', base: 'M2 34 L30 33 L58 30 L86 28 L114 25 L142 23', current: 'M2 37 L30 31 L58 24 L86 17 L114 11 L142 9' },
  ];
  processResult.querySelectorAll('tbody tr').forEach((row, index) => {
    const shape = trendShapes[index];
    const baseValue = row.children[1].textContent.trim();
    const comparisonValue = row.children[2].textContent.trim();
    row.querySelector('td:last-child').innerHTML = `<div class="comparison-trend ${shape.kind}" aria-label="\uae30\uc900 \uae30\uac04\uacfc \ube44\uad50 \uae30\uac04 \ucd94\uc774"><div class="trend-numbers"><span>\uae30\uc900 <b>${baseValue}</b></span><strong>\ube44\uad50 ${comparisonValue}</strong></div><svg viewBox="0 0 144 42"><line x1="0" y1="21" x2="144" y2="21"/><path class="baseline" d="${shape.base}"/><path class="comparison" d="${shape.current}"/></svg><small><i></i>\uae30\uc900 \uae30\uac04 <i class="comparison-key"></i>\ube44\uad50 \uae30\uac04</small></div>`;
  });
}

const processPage = document.querySelector('#process');
const managementStandardData = [
  { metric: '\ud488\uc9c8\ud568\ub7c9', actual: '2.38%', variance: '+0.03%p', status: 'danger', normal: '1.90 ~ 2.20%', warning: '2.20% \ucd08\uacfc', abnormal: '2.35% \ucd08\uacfc', effectiveFrom: '2024-01-01', version: 'v1.0' },
  { metric: '\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', actual: '963t/h', variance: '\uc815\uc0c1 \ubc94\uc704 \ub0b4', status: 'normal', normal: '950 ~ 1,080t/h', warning: '900t/h \ubbf8\ub9cc', abnormal: '850t/h \ubbf8\ub9cc', effectiveFrom: '2024-01-01', version: 'v1.0' },
  { metric: '\uac00\uc2a4 \ucd9c\uad6c\uc628\ub3c4', actual: '142.5℃', variance: '\uc815\uc0c1 \ubc94\uc704 \ub0b4', status: 'normal', normal: '135 ~ 145℃', warning: '147℃ \ucd08\uacfc', abnormal: '150℃ \ucd08\uacfc', effectiveFrom: '2024-01-01', version: 'v1.0' },
  { metric: '\ud488\uc9c8\ud568\ub7c9', actual: '2.38%', variance: '+0.08%p', status: 'danger', normal: '1.88 ~ 2.18%', warning: '2.18% \ucd08\uacfc', abnormal: '2.30% \ucd08\uacfc', effectiveFrom: '2026-01-01', version: 'v1.1' },
  { metric: '\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', actual: '963t/h', variance: '\uc815\uc0c1 \ubc94\uc704 \ub0b4', status: 'normal', normal: '960 ~ 1,075t/h', warning: '910t/h \ubbf8\ub9cc', abnormal: '860t/h \ubbf8\ub9cc', effectiveFrom: '2026-01-01', version: 'v1.1' },
  { metric: '\uac00\uc2a4 \ucd9c\uad6c\uc628\ub3c4', actual: '142.5℃', variance: '\uc815\uc0c1 \ubc94\uc704 \ub0b4', status: 'normal', normal: '136 ~ 144℃', warning: '146℃ \ucd08\uacfc', abnormal: '149℃ \ucd08\uacfc', effectiveFrom: '2026-01-01', version: 'v1.1' },
];
const standardUsageAnalysisData = [
  { item: '\uac00\uc2a4 \uc0ac\uc6a9\ub7c9', target: '1.042M Nm³', actual: '1.069M Nm³', change: '+0.027M Nm³ (+2.6%)', profitImpact: '-10.2\ubc31\ub9cc\uc6d0', status: 'danger', note: '\ubaa9\ud45c \ub300\ube44 \ub354 \uc0ac\uc6a9' },
  { item: '\uc57d\ud488 A \uc0ac\uc6a9\ub7c9', target: '497kg', actual: '515kg', change: '+18kg (+3.6%)', profitImpact: '-8.2\ubc31\ub9cc\uc6d0', status: 'danger', note: '\ubaa9\ud45c \ub300\ube44 \ub354 \ud22c\uc785' },
  { item: '\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', target: '36.5t/h', actual: '38.1t/h', change: '+1.6t/h (+4.4%)', profitImpact: '+0.8\ubc31\ub9cc\uc6d0', status: 'normal', note: '\uae30\uc900 \ub300\ube44 \uc808\uac10 \ud6a8\uacfc' },
];
if (processResult) {
  const standardResult = document.createElement('article');
  standardResult.className = 'card standard-comparison-result';
  processResult.insertAdjacentElement('afterend', standardResult);
  const processDateInputs = [...document.querySelectorAll('#process input[data-period-input]')];
  const renderStandardResult = () => {
    const mode = standardResult.querySelector('[data-standard-mode]')?.value || 'auto';
    const start = processDateInputs[0]?.value || '';
    const end = processDateInputs[1]?.value || start;
    const summaries = window.CogDataService.getKpiSummaries({ start, end });
    const relevant = summaries.filter((item) => ['qualityContent', 'steamUsage', 'gasOutletTemp'].includes(item.id));
    const rows = relevant.map((row) => '<tr><td><b>' + row.metric + '</b></td><td>' + row.actual + '</td><td><b>' + row.version + '</b><small>\uc801\uc6a9 \uc2dc\uc791 ' + row.effectiveFrom + '</small></td><td>' + row.normal + '</td><td>' + row.warning + '</td><td>' + row.abnormal + '</td><td><span class=\"status ' + row.status + '\">' + (row.status === 'danger' ? '\uc774\uc0c1' : '\uc815\uc0c1') + '</span></td><td class=\"' + (row.status === 'danger' ? 'red-text' : 'positive') + '\">' + row.variance + '</td></tr>').join('');
    const usageRows = standardUsageAnalysisData.map((row) => '<tr><td><b>' + row.item + '</b></td><td>' + row.target + '</td><td>' + row.actual + '</td><td class=\"' + (row.status === 'danger' ? 'red-text' : 'positive') + '\">' + row.change + '</td><td><b class=\"' + (row.status === 'danger' ? 'red-text' : 'positive') + '\">' + row.profitImpact + '</b><small>' + row.note + '</small></td></tr>').join('');
    standardResult.innerHTML = '<div class=\"card-title\"><div><h2>\uad00\ub9ac\uae30\uc900 \ub300\ube44 \ubd84\uc11d</h2><p>\uc120\ud0dd \uae30\uac04 \uc2e4\uc801\uc744 \uc2dc\uc810\ubcc4 \uc801\uc6a9 \uae30\uc900\uacfc \ub300\uc870\ud569\ub2c8\ub2e4.</p></div><label class=\"standard-mode\">\uae30\uc900 \uc801\uc6a9 <select data-standard-mode><option value=\"auto\">\uc801\uc6a9 \uc2dc\uc810 \uae30\uc900 \uc790\ub3d9</option><option value=\"v1.0\">v1.0 \uc9c1\uc811 \uc120\ud0dd</option><option value=\"v1.1\">v1.1 \uc9c1\uc811 \uc120\ud0dd</option></select></label></div><div class=\"standard-application\"><b>\uae30\uc900 \uc801\uc6a9 \uc548\ub0b4</b><span>\uc120\ud0dd \uae30\uac04\uc5d0 \uae30\uc900 \ubcc0\uacbd\uc77c\uc774 \ud3ec\ud568\ub418\uba74 \uc801\uc6a9 \uc2dc\uc791\uc77c \uae30\uc900\uc73c\ub85c \ubc84\uc804\ubcc4 \ubd84\ub9ac \ud310\uc815\ud569\ub2c8\ub2e4.</span></div><div class=\"standard-table-scroll\"><table class=\"simple-table compact\"><thead><tr><th>\uc9c0\ud45c</th><th>\uc120\ud0dd \uae30\uac04 \uc2e4\uc801</th><th>\uc801\uc6a9 \uae30\uc900</th><th>\uc815\uc0c1 \ubc94\uc704</th><th>\uc8fc\uc758</th><th>\uc774\uc0c1</th><th>\ud310\uc815</th><th>\uae30\uc900 \ub300\ube44</th></tr></thead><tbody>' + rows + '</tbody></table></div><h3 class=\"usage-analysis-title\">\uc0ac\uc6a9\ub7c9\u00b7\uc190\uc775 \uae30\uc900 \ub300\ube44</h3><div class=\"standard-table-scroll\"><table class=\"simple-table compact\"><thead><tr><th>\uad00\ub9ac \ud56d\ubaa9</th><th>\uae30\uc900 \uc0ac\uc6a9\ub7c9</th><th>\uc120\ud0dd \uae30\uac04 \uc2e4\uc81c</th><th>\uc0ac\uc6a9\ub7c9 \uc99d\uac10</th><th>\uae30\uc900 \ub300\ube44 \uc190\uc775 \uc601\ud5a5</th></tr></thead><tbody>' + usageRows + '</tbody></table></div>';
    standardResult.querySelector('[data-standard-mode]').addEventListener('change', renderStandardResult);
  };
  renderStandardResult();
  const resultTitle = processResult.querySelector('.card-title');
  const comparisonContent = document.createElement('div');
  comparisonContent.className = 'period-comparison-content';
  while (resultTitle.nextElementSibling) comparisonContent.appendChild(resultTitle.nextElementSibling);
  processResult.appendChild(comparisonContent);
  const analysisTabs = document.createElement('div');
  analysisTabs.className = 'analysis-mode-tabs';
  analysisTabs.innerHTML = '<button class=\"selected\" data-analysis-mode=\"period\">\uae30\uac04 \ube44\uad50 \ubd84\uc11d</button><button data-analysis-mode=\"standard\">\uad00\ub9ac\uae30\uc900 \ub300\ube44 \ubd84\uc11d</button>';
  resultTitle.appendChild(analysisTabs);
  standardResult.hidden = true;
  analysisTabs.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    const standardMode = button.dataset.analysisMode === 'standard';
    analysisTabs.querySelectorAll('button').forEach((tab) => tab.classList.toggle('selected', tab === button));
    comparisonContent.hidden = standardMode;
    standardResult.hidden = !standardMode;
  }));
}
if (processPage) {
  const processOverview = document.createElement('section');
  processOverview.id = 'processOverview';
  processOverview.className = 'view';
  processOverview.innerHTML = `
    <div class="page-head split"><div><p class="eyebrow">PROCESS OVERVIEW</p><h1>\uacf5\uc815 \ud604\ud669</h1><p>\uc120\ud0dd\ud55c \uae30\uac04\uc758 \uc8fc\uc694 KPI\uc640 \uacf5\uc815\ubcc0\uc218 \ud604\ud669\uc744 \ud55c\ub208\uc5d0 \ud655\uc778\ud569\ub2c8\ub2e4.</p></div><span class="synthetic">\ud569\uc131 \ub370\uc774\ud130</span></div>
    <article class="card process-overview-filter"><div class="period-inputs"><label>\uc870\ud68c \uc2dc\uc791<input data-period-input type="date" value="2025-12-01"></label><label>\uc870\ud68c \uc885\ub8cc<input data-period-input type="date" value="2025-12-31"></label><label class="time-mode"><input data-time-mode type="checkbox"> 시간 단위 조회</label></div><details class="metric-selector"><summary>\ud45c\uc2dc \uc9c0\ud45c \uc120\ud0dd <b class="visible-count">8\uac1c</b></summary><div class="metric-checks"></div></details><button class="primary" data-process-query>\uc870\ud68c</button></article>
    <article class="card process-data-table"><div class="card-title"><div><h2>\uc870\ud68c \uae30\uac04 \uc2e4\uc801 \ub370\uc774\ud130</h2><p>\uc77c\uc790 \uc21c\uc73c\ub85c KPI\uc640 \uc8fc\uc694 \uacf5\uc815\ubcc0\uc218 \uc2e4\uc801\uc744 \ud45c\uc2dc\ud569\ub2c8\ub2e4.</p></div><div class="table-actions"><span class="table-period-label"></span><button class="pill" type="button" data-process-export>\uc5d1\uc140 \ub2e4\uc6b4\ub85c\ub4dc \u2193</button></div></div><div class="process-table-scroll"><table class="simple-table compact"><thead><tr><th>\uc77c\uc790</th><th>\uad6c\ubd84</th><th>\ud56d\ubaa9</th><th>\uc2e4\uc801</th></tr></thead><tbody></tbody></table></div></article>
    <div class="overview-heading"><div><h2>\uc8fc\uc694 \uc9c0\ud45c \ud604\ud669</h2><p>\ud604\uc7ac\uac12\u00b7\uad00\ub9ac\uae30\uc900\u00b7\ucd94\uc774\ub97c \ud655\uc778\ud558\uace0 \ud544\uc694\ud55c \uc9c0\ud45c\ub9cc \uc120\ud0dd\ud574 \uc870\ud68c\ud569\ub2c8\ub2e4.</p></div><button class="outline" data-select-all>\uc804\uccb4 \uc9c0\ud45c \ubcf4\uae30</button></div>
    <div class="process-kpi-grid"></div>`;
  processPage.insertAdjacentElement('beforebegin', processOverview);
  views.push(processOverview);
  labels.overview = '\ud654\uc131\uacf5\uc7a5 \uc6b4\uc601\ud604\ud669';
  labels.processOverview = '\uacf5\uc815 \ud604\ud669';

  const metrics = [
    ['\ud488\uc9c8\ud568\ub7c9', '2.38%', '\uc774\uc0c1 2.35%', 'danger', 'M0 39 L30 37 L58 38 L86 24 L114 10 L150 7'],
    ['\uc815\uc81c\ub7c9', '1,058k Nm\u00b3', '\uc815\uc0c1 1,012~1,081k', 'normal', 'M0 34 L30 31 L58 23 L86 26 L114 15 L150 18'],
    ['\uc2a4\ud300 \uc0ac\uc6a9\ub7c9 (t/h)', '963t/h', '\uc815\uc0c1 950~1,080t/h', 'normal', 'M0 15 L30 18 L58 17 L86 27 L114 31 L150 34'],
    ['\uc57d\ud488 A \uc6d0\ub2e8\uc704', '0.475 kg/t', '\uc8fc\uc758 \uc0c1\ud55c 0.474', 'warning', 'M0 32 L30 28 L58 25 L86 27 L114 16 L150 13'],
    ['\uc57d\ud488 B \uc6d0\ub2e8\uc704', '0.392 kg/t', '\uc815\uc0c1 \uc0c1\ud55c 0.401', 'normal', 'M0 25 L30 24 L58 23 L86 20 L114 22 L150 25'],
    ['\uac00\uc2a4 \ucd9c\uad6c\uc628\ub3c4', '142.5\u2103', '\uc815\uc0c1 135~145\u2103', 'normal', 'M0 37 L30 34 L58 27 L86 20 L114 14 L150 12'],
    ['L/G\ube44', '1.46', '\uc815\uc0c1 1.40~1.55', 'normal', 'M0 24 L30 22 L58 24 L86 21 L114 25 L150 22'],
    ['\uc124\ube44 \ucc28\uc555', '61.8 bar', '\uc815\uc0c1 59.4~63.5 bar', 'normal', 'M0 28 L30 26 L58 30 L86 24 L114 28 L150 25'],
  ];
  const grid = processOverview.querySelector('.process-kpi-grid');
  const checks = processOverview.querySelector('.metric-checks');
  metrics.forEach(([name, value, criterion, status, path], index) => {
    grid.insertAdjacentHTML('beforeend', `<article class="process-kpi-card ${status}" data-metric="${index}"><div><b>${name}</b><strong>${value}</strong></div><svg viewBox="0 0 150 46"><line x1="0" y1="23" x2="150" y2="23"/><path d="${path}"/></svg><small>${criterion}</small><span>${status === 'danger' ? '\uc774\uc0c1' : status === 'warning' ? '\uc8fc\uc758' : '\uc815\uc0c1'}</span></article>`);
    checks.insertAdjacentHTML('beforeend', `<label><input type="checkbox" data-process-filter value="${index}" checked>${name}</label>`);
  });
  const filterInputs = [...processOverview.querySelectorAll('[data-process-filter]')];
  const overviewDateInputs = [...processOverview.querySelectorAll('[data-period-input]')];
  const actualTableBody = processOverview.querySelector('.process-data-table tbody');
  const actualTableHead = processOverview.querySelector('.process-data-table thead');
  const actualPeriodLabel = processOverview.querySelector('.table-period-label');
  const metricUnits = ['%', 'Nm³', 't', 'kg/t', 'kg/t', '℃', '-', 'bar'];
  const dailyActuals = [
    ['2.10%', '2.13%', '2.16%', '2.19%', '2.25%', '2.30%', '2.34%', '2.36%', '2.38%'],
    ['1,028k Nm³', '1,034k Nm³', '1,041k Nm³', '1,037k Nm³', '1,052k Nm³', '1,061k Nm³', '1,055k Nm³', '1,063k Nm³', '1,058k Nm³'],
    ['1,018t/h', '1,006t/h', '1,012t/h', '998t/h', '986t/h', '975t/h', '970t/h', '966t/h', '963t/h'],
    ['0.468 kg/t', '0.470 kg/t', '0.469 kg/t', '0.471 kg/t', '0.472 kg/t', '0.473 kg/t', '0.474 kg/t', '0.475 kg/t', '0.475 kg/t'],
    ['0.389 kg/t', '0.390 kg/t', '0.391 kg/t', '0.392 kg/t', '0.393 kg/t', '0.392 kg/t', '0.391 kg/t', '0.392 kg/t', '0.392 kg/t'],
    ['137.1℃', '138.0℃', '139.2℃', '140.1℃', '141.0℃', '142.0℃', '142.8℃', '143.1℃', '142.5℃'],
    ['1.43', '1.44', '1.45', '1.44', '1.46', '1.47', '1.46', '1.45', '1.46'],
    ['60.8 bar', '61.1 bar', '60.6 bar', '61.5 bar', '61.0 bar', '62.2 bar', '61.7 bar', '62.0 bar', '61.8 bar'],
  ];
  const formatDate = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  const renderActualTable = () => {
    const start = new Date(overviewDateInputs[0].value);
    const end = new Date(overviewDateInputs[1].value);
    const selectedIndexes = filterInputs.filter((input) => input.checked).map((input) => Number(input.value));
    const rows = [];
    actualTableHead.innerHTML = '<tr><th>\uc77c\uc790</th>' + selectedIndexes.map((metricIndex) => '<th>' + metrics[metricIndex][0] + '</th>').join('') + '</tr><tr class="process-table-units"><th>\ub2e8\uc704</th>' + selectedIndexes.map((metricIndex) => '<th>' + metricUnits[metricIndex] + '</th>').join('') + '</tr>';
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayIndex = Math.max(0, Math.round((date - start) / 86400000));
      rows.push('<tr><td>' + formatDate(date) + '</td>' + selectedIndexes.map((metricIndex) => '<td>' + dailyActuals[metricIndex][dayIndex % dailyActuals[metricIndex].length] + '</td>').join('') + '</tr>');
    }
    actualTableBody.innerHTML = rows.join('');
    actualPeriodLabel.textContent = formatDate(start) + ' ~ ' + formatDate(end) + ' · ' + rows.length + '\uc77c';
  };
  const syncMetricFilter = () => {
    filterInputs.forEach((input) => { grid.querySelector(`[data-metric="${input.value}"]`).hidden = !input.checked; });
    processOverview.querySelector('.visible-count').textContent = `${filterInputs.filter((input) => input.checked).length}\uac1c`;
  };
  filterInputs.forEach((input) => input.addEventListener('change', () => { syncMetricFilter(); renderActualTable(); }));
  processOverview.querySelector('[data-select-all]').addEventListener('click', () => { filterInputs.forEach((input) => { input.checked = true; }); syncMetricFilter(); renderActualTable(); });
  installPeriodMode(processOverview, overviewDateInputs);
  processOverview.querySelector('[data-process-query]').addEventListener('click', renderActualTable);
  processOverview.querySelector('[data-process-export]').addEventListener('click', () => {
    const table = processOverview.querySelector('.process-data-table table');
    const html = '<html><head><meta charset="UTF-8"></head><body>' + table.outerHTML + '</body></html>';
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' })); link.download = '공정현황_조회결과.xls'; link.click(); URL.revokeObjectURL(link.href);
  });
  renderActualTable();
  processOverview.querySelector('[data-process-query]').addEventListener('click', () => { processOverview.querySelector('.overview-heading p').textContent = '\uc120\ud0dd\ud55c \uae30\uac04\uc758 \uc870\ud68c \uacb0\uacfc\uc785\ub2c8\ub2e4. \ud544\uc694\ud55c \uc9c0\ud45c\ub9cc \uc120\ud0dd\ud574 \ud655\uc778\ud558\uc138\uc694.'; });
}

const renameCostImpactText = () => {
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    node.nodeValue = node.nodeValue
      .replaceAll('\uc6d0\uac00 \uc601\ud5a5', '\uc190\uc775 \uc601\ud5a5')
      .replaceAll('\uc6d0\uac00\uc601\ud5a5', '\uc190\uc775\uc601\ud5a5');
  });
  labels.cost = '\uc190\uc775 \uc601\ud5a5';
};

const addImpactPeriodFilter = (viewId, title) => {
  const view = document.querySelector(viewId);
  const pageHead = view && view.querySelector('.page-head');
  if (!pageHead) return;
  const filter = document.createElement('article');
  filter.className = 'card impact-period-filter';
  filter.innerHTML = '<div class="impact-period-label"><b>' + title + ' \uc870\ud68c \uae30\uac04</b><span>\ud569\uc131 \ub370\uc774\ud130 \uae30\uc900</span></div><div class="impact-period-inputs"><label>\uc2dc\uc791<input data-period-input type="date" value="2025-12-01"></label><label>\uc885\ub8cc<input data-period-input type="date" value="2025-12-31"></label><label class="time-mode"><input data-time-mode type="checkbox"> 시간 단위 조회</label></div><div class="impact-quick"><button type="button">\uc804\uc77c</button><button type="button">\uc804 7\uc77c</button><button type="button">\uc804 30\uc77c</button></div><button class="primary" type="button">\uc870\ud68c</button><small class="impact-period-selected"></small>';
  pageHead.insertAdjacentElement('afterend', filter);
  const inputs = [...filter.querySelectorAll('[data-period-input]')];
  const selected = filter.querySelector('.impact-period-selected');
  const format = (value) => value.slice(0, 10).replaceAll('-', '.');
  const updateSelected = () => { selected.textContent = '\uc801\uc6a9 \uae30\uac04: ' + format(inputs[0].value) + ' ~ ' + format(inputs[1].value); };
  installPeriodMode(filter, inputs);
  filter.querySelector('.primary').addEventListener('click', updateSelected);
  updateSelected();
};

renameCostImpactText();
addImpactPeriodFilter('#diagnosis', '\uc774\uc0c1 \uc9c4\ub2e8');
addImpactPeriodFilter('#cost', '\uc190\uc775 \uc601\ud5a5');

let profitImpactFilters = { start: '2025-01-01', end: '2025-12-31' };
const rangeDays = (filters) => Math.max(1, Math.round((new Date(filters.end) - new Date(filters.start)) / 86400000) + 1);
let profitGranularity = rangeDays(profitImpactFilters) <= 31 ? 'day' : 'month';
let profitImpactData = window.CogDataService.getCostRecords({ ...profitImpactFilters, granularity: profitGranularity });

const waterfall = document.querySelector('#cost .waterfall');
if (waterfall) {
  const impactCard = document.createElement('article');
  impactCard.className = 'card impact-composition-card';
  const impactItems = [...new Set(profitImpactData.map((row) => row.costItem))];
  const totals = impactItems.map((costItem) => {
    const rows = profitImpactData.filter((row) => row.costItem === costItem);
    const actual = rows.reduce((sum, row) => sum + row.actualProfitImpact, 0);
    const baseline = rows.reduce((sum, row) => sum + row.baselineProfitImpact, 0);
    return { costItem, actual, baseline, variance: actual - baseline };
  });
  const maxTotal = Math.max(...totals.map((row) => Math.abs(row.actual)), 1);
  const moneyLabel = (value) => (value >= 0 ? '+' : '') + value.toFixed(1) + '\ubc31\ub9cc\uc6d0';
  impactCard.innerHTML = '<div class="card-title"><div><h2>\ud56d\ubaa9\ubcc4 \uc190\uc775 \uc601\ud5a5</h2><p>\uc120\ud0dd \uae30\uac04 \ub204\uacc4 \uae08\uc561\uacfc \uae30\uc900 \ub300\ube44 \uc808\uac10 \ud6a8\uacfc\ub97c \ud655\uc778\ud569\ub2c8\ub2e4.</p></div><span class="criterion-key">\uae30\uc900 \ub300\ube44 = \uc2e4\uc81c \uc190\uc775\uc601\ud5a5 - \uae30\uc900 \uc190\uc775\uc601\ud5a5</span></div><div class="impact-composition-chart">' + totals.map((row, index) => '<div class="impact-bar-row impact-' + index + '"><div><b>' + row.costItem + '</b><span>' + moneyLabel(row.actual) + ' <em>(\uae30\uc900 \ub300\ube44 ' + moneyLabel(row.variance) + ')</em></span></div><i><em style="width:' + (Math.abs(row.actual) / maxTotal * 100) + '%"></em></i><small>\uae30\uc900 ' + moneyLabel(row.baseline) + ' · ' + (row.variance >= 0 ? '\uc808\uac10' : '\uc545\ud654') + ' ' + Math.abs(row.variance / (row.baseline || 1) * 100).toFixed(1) + '%</small></div>').join('') + '</div>';
  impactCard.querySelector('.card-title').insertAdjacentHTML('beforeend', '<div class="profit-toolbar"><div class="segmented"><button type="button" data-profit-granularity="day">\uc77c\ubcc4</button><button type="button" data-profit-granularity="month">\uc6d4\ubcc4</button></div><button class="pill" type="button" data-profit-export>\uc5d1\uc140 \ub2e4\uc6b4\ub85c\ub4dc \u2193</button></div>');
  waterfall.closest('.card').replaceWith(impactCard);
}

const monthlyNet = document.querySelector('#cost .monthly-net');
if (monthlyNet) {
  const profitDetail = document.createElement('article');
  profitDetail.className = 'card profit-impact-detail';
  monthlyNet.closest('.card').replaceWith(profitDetail);
  const costItems = [...new Set(profitImpactData.map((row) => row.costItem))];
  const detailItems = [...costItems, ...['약품 A', '약품 B'].filter((item) => !costItems.includes(item))];
  const money = (value) => (value >= 0 ? '+' : '') + value.toFixed(1) + '\ubc31\ub9cc\uc6d0';
  const rowClass = (value) => value >= 0 ? 'positive' : 'negative';
  const profitRowsFor = (costItem) => window.CogDataService.getCostRecords({ ...profitImpactFilters, granularity: profitGranularity, costItem }).map((row) => ({ ...row, month: profitGranularity === 'day' ? row.period.slice(5) : Number(row.period.slice(5, 7)) }));
  const periodLabel = (row) => profitGranularity === 'day' ? row.period.slice(5).replace('-', '/') : row.period.slice(2);
  let selectedProfitChartItem = null;
  const renderProfitItemCharts = (focusedItem = selectedProfitChartItem) => {
    const chartItems = focusedItem ? [focusedItem] : costItems;
    const charts = chartItems.map((costItem) => {
      const rows = (costItem === '약품 A' || costItem === '약품 B'
        ? window.CogDataService.getCostRecords({ ...profitImpactFilters, costItem })
        : profitImpactData.filter((row) => row.costItem === costItem))
        .map((row) => ({ ...row, month: profitGranularity === 'day' ? row.period.slice(5) : Number(row.period.slice(5, 7)) }));
      const maxValue = Math.max(1.4, ...rows.map((row) => Math.abs(row.actualProfitImpact)));
      const actualTotal = rows.reduce((sum, row) => sum + row.actualProfitImpact, 0);
      const baselineTotal = rows.reduce((sum, row) => sum + row.baselineProfitImpact, 0);
      const varianceTotal = actualTotal - baselineTotal;
      const pointX = (index) => 46 + index * 65;
      const pointY = (value) => 152 - value * 112 / maxValue;
      const bars = rows.map((row, index) => {
        const y = Math.min(152, pointY(row.actualProfitImpact));
        const valueY = row.actualProfitImpact >= 0 ? y - 7 : y + Math.abs(row.actualProfitImpact * 112 / maxValue) + 14;
        return '<g><title>' + row.month + '\uc6d4 | \uc2e4\uc81c: ' + money(row.actualProfitImpact) + ' | \uae30\uc900: ' + money(row.baselineProfitImpact) + ' | \ucd08\uacfc/\uc808\uac10: ' + money(row.variance) + '</title><rect class=\"profit-bar ' + rowClass(row.actualProfitImpact) + '\" x=\"' + (pointX(index) - 11) + '\" y=\"' + y + '\" width=\"22\" height=\"' + Math.abs(row.actualProfitImpact * 112 / maxValue) + '\" rx=\"2\"/><text class=\"profit-value\" x=\"' + pointX(index) + '\" y=\"' + valueY + '\">' + money(row.actualProfitImpact) + '</text><text class=\"profit-month\" x=\"' + pointX(index) + '\" y=\"218\">25.' + String(row.month).padStart(2, '0') + '</text></g>';
      }).join('');
      const numberRows = '';
      const points = rows.map((row, index) => pointX(index) + ',' + pointY(row.baselineProfitImpact)).join(' ');
      const last = rows.at(-1);
      return '<article class=\"profit-item-chart\"><div><h4>' + costItem + '</h4><span class=\"profit-chart-summary\">\uc2e4\uc81c \ub204\uacc4 <b>' + money(actualTotal) + '</b> <em>(\uae30\uc900 \ub300\ube44 ' + money(varianceTotal) + ')</em><small>\ub9c9\ub300 \uc2e4\uc81c · \uc120 \uad00\ub9ac\uae30\uc900</small></span></div><svg viewBox=\"0 0 800 230\" aria-label=\"' + costItem + ' \uc6d4\ubcc4 \uc2e4\uc81c \uc190\uc775\uc601\ud5a5\uacfc \uad00\ub9ac\uae30\uc900\"><line class=\"profit-grid\" x1=\"18\" y1=\"36\" x2=\"790\" y2=\"36\"/><line class=\"profit-zero\" x1=\"18\" y1=\"152\" x2=\"790\" y2=\"152\"/><line class=\"profit-grid\" x1=\"18\" y1=\"204\" x2=\"790\" y2=\"204\"/>' + bars + '<polyline class=\"profit-baseline\" points=\"' + points + '\"/><text class=\"profit-baseline-label\" x=\"' + (pointX(rows.length - 1) + 10) + '\" y=\"' + (pointY(last.baselineProfitImpact) - 8) + '\">\uae30\uc900 ' + money(last.baselineProfitImpact) + '</text></svg>' + numberRows + '<small>\uae30\uc900 \ub204\uacc4 ' + money(baselineTotal) + ' · \uc2e4\uc81c \ub204\uacc4 ' + money(actualTotal) + '</small></article>';
    }).join('');
    return '<section class=\"profit-item-charts\">' + charts + '</section>';
  };
  const renderDetail = (selectedItem) => {
    if (window.CogUiState) window.CogUiState.selectedProfitItem = selectedItem;
    const selectedRows = (selectedItem === '약품 A' || selectedItem === '약품 B'
      ? window.CogDataService.getCostRecords({ ...profitImpactFilters, costItem: selectedItem })
      : profitImpactData.filter((row) => row.costItem === selectedItem))
      .map((row) => ({ ...row, month: Number(row.period.slice(5, 7)) }));
    selectedRows.splice(0, selectedRows.length, ...profitRowsFor(selectedItem));
    const displayedMonths = [...new Set(selectedRows.map((row) => row.period))].sort();
    const maxValue = Math.max(1.4, ...selectedRows.flatMap((row) => [Math.abs(row.actualProfitImpact), Math.abs(row.baselineProfitImpact)]));
    const chartHeight = 190;
    const zeroY = 100;
    const scale = 72 / maxValue;
    const barWidth = 19;
    const pointX = (index) => 42 + index * 57;
    const pointY = (value) => zeroY - value * scale;
    const bars = selectedRows.map((row, index) => {
      const y = Math.min(zeroY, pointY(row.actualProfitImpact));
      const height = Math.abs(row.actualProfitImpact * scale);
      return '<g><title>' + row.month + '\uc6d4 | \uc2e4\uc81c \uc190\uc775\uc601\ud5a5: ' + money(row.actualProfitImpact) + ' | \uae30\uc900 \uc190\uc775\uc601\ud5a5: ' + money(row.baselineProfitImpact) + ' | \uae30\uc900 \ub300\ube44: ' + money(row.variance) + '</title><rect class=\"profit-bar ' + rowClass(row.actualProfitImpact) + '\" x=\"' + (pointX(index) - barWidth / 2) + '\" y=\"' + y + '\" width=\"' + barWidth + '\" height=\"' + height + '\" rx=\"2\"/><text class=\"profit-month\" x=\"' + pointX(index) + '\" y=\"184\">' + row.month + '\uc6d4</text></g>';
    }).join('');
    const linePoints = selectedRows.map((row, index) => pointX(index) + ',' + pointY(row.baselineProfitImpact)).join(' ');
    const lineDots = selectedRows.map((row, index) => '<circle cx=\"' + pointX(index) + '\" cy=\"' + pointY(row.baselineProfitImpact) + '\" r=\"3\"/>').join('');
    const tableRows = costItems.map((costItem) => {
      const values = profitImpactData.filter((row) => row.costItem === costItem);
      return '<tr data-profit-item=\"' + costItem + '\" class=\"' + (costItem === selectedItem ? 'selected' : '') + '\"><td><b>' + costItem + '</b></td>' + values.map((row) => '<td class=\"' + rowClass(row.actualProfitImpact) + '\">' + money(row.actualProfitImpact) + '</td>').join('') + '</tr>';
    }).join('');
    const cumulativeActual = selectedRows.reduce((sum, row) => sum + row.actualProfitImpact, 0);
    const cumulativeBaseline = selectedRows.reduce((sum, row) => sum + row.baselineProfitImpact, 0);
    const cumulativeVariance = cumulativeActual - cumulativeBaseline;
    const varianceRate = Math.abs(cumulativeVariance / (cumulativeBaseline || 1) * 100).toFixed(1);
    const periodSummary = '<div class=\"period-summary\"><span>\uc120\ud0dd \uae30\uac04 \ub204\uacc4 <b class=\"' + rowClass(cumulativeActual) + '\">' + money(cumulativeActual) + '</b></span><span>\uae30\uc900 \ub204\uacc4 <b>' + money(cumulativeBaseline) + '</b></span><span>\uae30\uc900 \ub300\ube44 <b class=\"' + rowClass(cumulativeVariance) + '\">' + money(cumulativeVariance) + ' ' + (cumulativeVariance >= 0 ? '\uc808\uac10' : '\uc545\ud654') + ' <em>(' + (cumulativeVariance >= 0 ? '+' : '-') + varianceRate + '%)</em></b></span></div>';
    profitDetail.innerHTML = '<div class=\"card-title\"><div><h2>\uc6d4\ubcc4 \uc190\uc775\uc601\ud5a5</h2><p>\ud45c\uc5d0\uc11c \uc804\uccb4 \ud604\ud669\uc744 \ud655\uc778\ud558\uace0, \ud56d\ubaa9\uc744 \uc120\ud0dd\ud574 \uae30\uc900 \ub300\ube44 \uc0c1\uc138 \ucd94\uc774\ub97c \ubd05\ub2c8\ub2e4.</p></div><button class=\"pill\">CSV \ub2e4\uc6b4\ub85c\ub4dc \u2193</button></div><div class=\"profit-table-scroll\"><table class=\"simple-table compact profit-impact-table\"><thead><tr><th>\uc190\uc775 \ud56d\ubaa9</th>' + Array.from({ length: 12 }, (_, index) => '<th>' + (index + 1) + '\uc6d4</th>').join('') + '</tr></thead><tbody>' + tableRows + '</tbody></table></div><div class=\"profit-item-tabs\">' + costItems.map((costItem) => '<button class=\"' + (costItem === selectedItem ? 'selected' : '') + '\" data-profit-item=\"' + costItem + '\">' + costItem + '</button>').join('') + '</div><section class=\"profit-detail-chart\"><div class=\"card-title\"><div><h3>' + selectedItem + ' \uc6d4\ubcc4 \uc0c1\uc138</h3><p>\ub9c9\ub300: \uc2e4\uc81c \uc190\uc775\uc601\ud5a5 · \uc120: \uc6d4\ubcc4 \uae30\uc900 \uc190\uc775\uc601\ud5a5</p></div><span class=\"criterion-key\">\ub9c9\ub300 \ud638\ubc84 \uc2dc \uc2e4\uc81c\u00b7\uae30\uc900\u00b7\ucc28\uc774 \ud655\uc778</span></div><div class=\"profit-chart-wrap\"><div class=\"profit-y-axis\"><span>+' + maxValue.toFixed(1) + '\uc5b5</span><span>0</span><span>-' + maxValue.toFixed(1) + '\uc5b5</span></div><svg viewBox=\"0 0 710 ' + chartHeight + '\" role=\"img\" aria-label=\"' + selectedItem + ' \uc6d4\ubcc4 \uc2e4\uc81c \ubc0f \uae30\uc900 \uc190\uc775\uc601\ud5a5\"><line class=\"profit-grid\" x1=\"18\" y1=\"28\" x2=\"700\" y2=\"28\"/><line class=\"profit-zero\" x1=\"18\" y1=\"100\" x2=\"700\" y2=\"100\"/><line class=\"profit-grid\" x1=\"18\" y1=\"172\" x2=\"700\" y2=\"172\"/>' + bars + '<polyline class=\"profit-baseline\" points=\"' + linePoints + '\"/>' + lineDots + '</svg></div></section>';
    profitDetail.querySelector('.profit-impact-table thead tr').innerHTML = '<th>\uc190\uc775 \ud56d\ubaa9</th>' + displayedMonths.map((month) => '<th>' + month + '\uc6d4</th>').join('');
    profitDetail.querySelectorAll('.profit-y-axis span').forEach((axis) => { axis.textContent = axis.textContent.replace('억', '백만원'); });
    const detailTabs = profitDetail.querySelector('.profit-item-tabs');
    detailItems.filter((item) => !costItems.includes(item)).forEach((item) => detailTabs.insertAdjacentHTML('beforeend', '<button class="' + (item === selectedItem ? 'selected' : '') + '" data-profit-item="' + item + '">' + item + '</button>'));
    profitDetail.querySelector('.profit-item-tabs').insertAdjacentHTML('afterend', periodSummary);
    profitDetail.querySelector('.profit-detail-chart').remove();
    profitDetail.querySelectorAll('[data-profit-item]').forEach((element) => element.addEventListener('click', () => renderDetail(element.dataset.profitItem)));
    selectedProfitChartItem = selectedItem === '약품 A' || selectedItem === '약품 B' ? selectedItem : null;
    const visibleCharts = document.querySelector('#cost .profit-item-charts');
    if (visibleCharts) visibleCharts.replaceWith(document.createRange().createContextualFragment(renderProfitItemCharts(selectedProfitChartItem)));
  };
  renderDetail(detailItems.includes('약품 전체') ? '약품 전체' : costItems[0]);
  window.__renderProfitImpactDetail = renderDetail;
  window.__setProfitGranularity = (value) => {
    profitGranularity = value;
    profitImpactData = window.CogDataService.getCostRecords({ ...profitImpactFilters, granularity: value });
    renderDetail(dataDrivenState.selectedProfitItem || costItems[0]);
    document.querySelectorAll('#cost .profit-month').forEach((element) => element.classList.add('profit-period-label'));
    document.querySelectorAll('#cost [data-profit-granularity]').forEach((button) => button.classList.toggle('selected', button.dataset.profitGranularity === value));
  };
  const topImpactCard = document.querySelector('#cost .impact-composition-card');
  const topImpactChart = topImpactCard?.querySelector('.impact-composition-chart');
  if (topImpactChart) topImpactChart.replaceWith(document.createRange().createContextualFragment(renderProfitItemCharts()));
  const topChartLayout = topImpactCard?.parentElement;
  const compositionCard = topChartLayout?.querySelector('.card:not(.impact-composition-card)');
  const profitTable = profitDetail.querySelector('.profit-table-scroll');
  if (compositionCard && profitTable) {
    topChartLayout.classList.add('profit-charts-full');
    const tableWithComposition = document.createElement('div');
    tableWithComposition.className = 'profit-table-with-composition';
    profitTable.replaceWith(tableWithComposition);
    tableWithComposition.appendChild(profitTable);
    compositionCard.classList.remove('card');
    compositionCard.classList.add('profit-composition-side');
    tableWithComposition.appendChild(compositionCard);
  }
  cost.querySelector('.metric-grid')?.remove();
  cost.querySelector('.impact-period-filter')?.insertAdjacentElement('afterend', profitDetail);
  window.refreshProfitImpactView = (selectedItem = dataDrivenState?.selectedProfitItem || costItems[0]) => {
    const available = detailItems;
    const item = available.includes(selectedItem) ? selectedItem : available[0];
    dataDrivenState.selectedProfitItem = item;
    renderDetail(item);
    const renderedCharts = topImpactCard?.querySelector('.profit-item-charts');
    if (renderedCharts) renderedCharts.replaceWith(document.createRange().createContextualFragment(renderProfitItemCharts(selectedProfitChartItem)));
  };
}

const formatCostUnitText = () => {
  const costView = document.querySelector('#cost');
  if (!costView) return;
  const textNodes = [];
  const walker = document.createTreeWalker(costView, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    node.nodeValue = node.nodeValue.replace(/([+-]?)₩(\d+(?:\.\d+)?)M\b/g, '$1$2\ubc31\ub9cc\uc6d0');
  });
};
formatCostUnitText();

// Shared UI state and render bridge: every approved screen reads the same API-ready mock model.
const dataDrivenState = {
  start: '', end: '', plant: '화성공장', process: 'COG 정제공정', product: 'COG', selectedProfitItem: '약품 전체', selectedEventId: 'EX07',
};
const latestDataPeriod = window.CogMockData.dailyObservations.map((row) => row.period).sort().at(-1) || window.CogMockData.metadata.referenceAt.slice(0, 10);
dataDrivenState.start = latestDataPeriod;
dataDrivenState.end = latestDataPeriod;
const processAnalysisState = { metricIds: ['qualityContent', 'steamUsage', 'gasOutletTemp'] };
const formatMetricValue = (summary) => !summary?.hasData || !Number.isFinite(summary.value) ? '-' : `${summary.value.toLocaleString(undefined, { maximumFractionDigits: summary.decimals })}${summary.unit ? ` ${summary.unit}` : ''}`;
const standardDisplayDigits = (summary) => ({ steamUsage: 1, qualityContent: 3, gasOutletTemp: 1 }[summary.id] ?? summary.decimals);
const formatStandardValue = (value, summary) => !Number.isFinite(value) ? '-' : `${value.toLocaleString(undefined, { minimumFractionDigits: standardDisplayDigits(summary), maximumFractionDigits: standardDisplayDigits(summary) })}${summary.unit}`;
const formatStandardVariance = (summary) => !Number.isFinite(summary.variance) ? '-' : `${summary.variance >= 0 ? '+' : ''}${summary.variance.toLocaleString(undefined, { minimumFractionDigits: standardDisplayDigits(summary), maximumFractionDigits: standardDisplayDigits(summary) })}${summary.unit}`;
const statusClass = (status) => status === 'abnormal' ? 'danger' : status === 'warning' ? 'warning' : 'normal';
const statusLabel = (status) => status === 'abnormal' ? '이상' : status === 'warning' ? '주의' : '정상';
const kpiDetailState = { overview: false, brief: false, summaries: [] };
const trendSvg = (summary) => {
  const values = summary.series.slice(-6).map((row) => row.value);
  const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1;
  const path = values.map((value, index) => `${index ? 'L' : 'M'}${index * 32} ${36 - ((value - min) / spread) * 28}`).join(' ');
  return `<svg class="table-trend ${statusClass(summary.status)}" viewBox="0 0 160 42"><line x1="0" y1="20" x2="160" y2="20"/><path d="${path}"/></svg>`;
};
const standardText = (summary) => {
  const { standard } = summary;
  if (!standard) return '-';
  if (standard.normalMin !== undefined && standard.normalMax !== undefined) return `정상 ${formatStandardValue(standard.normalMin, summary)} ~ ${formatStandardValue(standard.normalMax, summary)}`;
  return `관리 상한 ${formatStandardValue(standard.normalMax, summary)}`;
};
// The lower table is a management-standard view, not a cumulative usage view.
// Keep its cost effect from the existing cost records, but show the same KPI
// target, actual value and unit as the management-standard table above.
const managementCostMetricMap = [
  { metricId: 'steamUsage', costItemKeyword: '스팀' },
  { metricId: 'qualityContent', costItemKeyword: '약품' },
  { metricId: 'gasOutletTemp', costItemKeyword: '가스' },
];
function renderKpiTables(summaries) {
  kpiDetailState.summaries = summaries;
  const sorted = [...summaries].sort((a, b) => ({ abnormal: 0, warning: 1, normal: 2 }[a.status] - { abnormal: 0, warning: 1, normal: 2 }[b.status]));
  const overviewItems = kpiDetailState.overview ? sorted : sorted.slice(0, 3);
  const briefItems = kpiDetailState.brief ? sorted : sorted.slice(0, 3);
  const rows = overviewItems.map((summary) => `<tr><td><span class="status ${statusClass(summary.status)}">● ${statusLabel(summary.status)}</span></td><td><b>${summary.label}</b></td><td class="${summary.status === 'abnormal' ? 'red-text' : summary.status === 'warning' ? 'orange' : 'positive'}"><b>${formatMetricValue(summary)}</b></td><td>${standardText(summary)} <b>${summary.variance >= 0 ? '+' : ''}${summary.variance}${summary.unit}</b></td><td>목표 ${summary.standard.target}${summary.unit} 대비 <b>${summary.targetVariance >= 0 ? '+' : ''}${summary.targetVariance}${summary.unit}</b></td><td>${trendSvg(summary)}<small>점선: 관리 기준</small></td></tr>`).join('');
  const overviewTable = document.querySelector('#overview .kpi-status-board tbody');
  if (overviewTable) overviewTable.innerHTML = rows;
  const briefTable = document.querySelector('#brief table.simple-table tbody');
  if (briefTable) briefTable.innerHTML = briefItems.map((summary) => `<tr><td>${summary.label}</td><td class="${summary.status === 'abnormal' ? 'red-text' : summary.status === 'warning' ? 'orange' : 'positive'}">${formatMetricValue(summary)}</td><td>${standardText(summary)}</td><td>${summary.targetVariance >= 0 ? '+' : ''}${summary.targetVariance}${summary.unit}</td><td>${trendSvg(summary)}<small>점선: 관리 기준</small></td></tr>`).join('');
  const overviewToggle = document.querySelector('#overview .kpi-detail-toggle');
  if (overviewToggle) overviewToggle.textContent = kpiDetailState.overview ? '주요 KPI만 보기' : `전체 KPI 현황 보기 (${Math.max(0, sorted.length - 3)}개 추가)`;
  const briefToggle = document.querySelector('#brief .brief-kpi-detail-toggle');
  if (briefToggle) briefToggle.textContent = kpiDetailState.brief ? '주요 KPI만 보기' : `전체 KPI 현황 보기 (${Math.max(0, sorted.length - 3)}개 추가)`;
}
function getOverviewSparkSeries(metricId, selectedSeries) {
  if (selectedSeries.length >= 5) return selectedSeries;
  const end = dataDrivenState.end || selectedSeries.at(-1)?.period;
  if (!end) return selectedSeries;
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() - 4);
  const start = `${endDate.toISOString().slice(0, 10)}T07:00`;
  return window.CogDataService.getMetricSeries(metricId, { start, end });
}

function renderOverviewSparks(summaries) {
  const metricIds = ['qualityContent', 'steamUsage', 'purifiedVolume', 'gasOutletTemp'];
  const cards = document.querySelectorAll('#overview .spark-grid .spark');
  cards.forEach((card, index) => {
    const summary = summaries.find((item) => item.id === metricIds[index]);
    if (!summary || !summary.hasData) {
      card.querySelector(':scope > b')?.replaceChildren('—');
      card.querySelector(':scope > small')?.replaceChildren('조회 데이터 없음');
      card.querySelector('.spark-meta span')?.replaceChildren('선택 기간 데이터 없음');
      card.querySelector('.spark-meta b')?.replaceChildren('—');
      card.querySelector('svg path')?.setAttribute('d', 'M0 23 L120 23');
      card.dataset.trendPeriods = '';
      return;
    }
    const value = card.querySelector(':scope > b');
    const target = card.querySelector(':scope > small');
    const meta = card.querySelector('.spark-meta');
    const svg = card.querySelector('svg');
    if (value) value.textContent = formatMetricValue(summary);
    if (target) target.textContent = `${summary.targetVariance >= 0 ? '+' : ''}${summary.targetVariance}${summary.unit}`;
    if (meta) {
      const metaLabel = meta.querySelector('span');
      const metaValue = meta.querySelector('b');
      if (metaLabel) metaLabel.textContent = standardText(summary);
      if (metaValue) metaValue.textContent = `목표 대비 ${summary.targetVariance >= 0 ? '+' : ''}${summary.targetVariance}${summary.unit}`;
    }
    if (svg) {
      const trendSeries = getOverviewSparkSeries(summary.id, summary.series);
      const values = trendSeries.map((row) => row.value);
      card.dataset.trendPeriods = trendSeries.map((row) => row.period).join(',');
      const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1;
      const path = values.map((item, itemIndex) => `${itemIndex ? 'L' : 'M'}${itemIndex * (120 / Math.max(values.length - 1, 1))} ${31 - ((item - min) / spread) * 26}`).join(' ');
      const line = svg.querySelector('line');
      if (line) line.setAttribute('y1', '15'), line.setAttribute('y2', '15');
      const actualPath = svg.querySelector('path');
      if (actualPath) actualPath.setAttribute('d', path);
    }
  });
}
function renderBriefAndOverviewSummary(summaries, profit) {
  const groups = ['normal', 'warning', 'abnormal'].map((status) => summaries.filter((item) => item.status === status));
  const alertSection = document.querySelector('#brief .brief-alert-kpis');
  if (alertSection) {
    [['warning', groups[1], '주의 KPI'], ['danger', groups[2], '이상 KPI']].forEach(([className, items, title]) => {
      const group = alertSection.querySelector(`.brief-alert-group.${className}`);
      if (!group) return;
      group.querySelector('b').innerHTML = `${title} <em>${items.length}건</em>`;
      const list = group.querySelector('.brief-alert-items');
      if (!list) return;
      list.innerHTML = items.length ? items.map((item) => `<div class="brief-alert-item"><div><span>${item.label}</span><strong>${formatMetricValue(item)}</strong></div><small>${standardText(item)} · 기준 대비 ${item.variance >= 0 ? '+' : ''}${item.variance}${item.unit}</small></div>`).join('') : '<span class="brief-alert-empty">현재 해당 KPI 없음</span>';
    });
  }
  document.querySelectorAll('.brief-kpi-satisfaction').forEach((element) => {
    element.innerHTML = `<b>KPI 만족 현황</b><span><strong>${summaries.length}개 중 ${groups[0].length}개 정상</strong> · 주의 ${groups[1].length}개(${groups[1].map((item) => item.label).join(', ') || '없음'}) · 이상 ${groups[2].length}개(${groups[2].map((item) => item.label).join(', ') || '없음'})</span><em>우선 조치: ${groups[2][0]?.label || '정상 운영 유지'} ${groups[2][0] ? '이상 원인 점검' : ''}</em>`;
  });
  document.querySelectorAll('.brief-kpi-snapshot').forEach((snapshot) => {
    snapshot.innerHTML = `<b>핵심 KPI</b>${summaries.slice(0, 3).map((item) => `<div><span>${item.label}</span><strong class="${item.status === 'abnormal' ? 'red-text' : item.status === 'warning' ? 'orange' : 'positive'}">${formatMetricValue(item)}</strong><small>기준 대비 ${item.variance >= 0 ? '+' : ''}${item.variance}${item.unit}</small></div>`).join('')}`;
  });
  document.querySelectorAll('.period-profit-summary').forEach((element) => {
    const sign = profit.actualProfitImpact >= 0 ? '+' : '';
    element.querySelector('b')?.replaceChildren(`${sign}${profit.actualProfitImpact.toFixed(1)}백만원`);
    const small = element.querySelector('small');
    if (small) small.textContent = `기준 ${profit.baselineProfitImpact.toFixed(1)}백만원 대비 ${profit.variance >= 0 ? '+' : ''}${profit.variance.toFixed(1)}백만원`;
  });
}
function renderOverviewNarrative(summaries, filters) {
  const focus = summaries.find((item) => item.status === 'abnormal') || summaries.find((item) => item.status === 'warning');
  const event = window.CogDataService.getEvents(filters)[0];
  const insight = document.querySelector('#overview .insight-list');
  if (insight) insight.innerHTML = focus
    ? `<div><b>${focus.label} ${statusLabel(focus.status)} 징후 확인</b><p>선택 기간의 ${focus.label}가 관리기준을 벗어났습니다. 관련 공정 지표를 우선 확인합니다.</p></div><div><b>최우선 조치: 관련 공정 상태 점검</b><p>${event ? `${event.id} ${event.name} 구간의 연관 지표를 확인합니다.` : '다음 조업일까지 해당 지표의 추이를 모니터링합니다.'}</p></div>`
    : '<div><b>선택 기간 정상 운영</b><p>선택 기간에 관리기준을 벗어난 KPI가 없습니다.</p></div><div><b>권장 조치: 현재 상태 유지</b><p>다음 조회에서도 같은 기준으로 추이를 확인합니다.</p></div>';
  const diagnosis = document.querySelector('#overview .diagnosis-card');
  if (diagnosis) {
    diagnosis.querySelector('.event-banner').innerHTML = focus ? `<span>${event ? `${event.id} · ${event.name}` : `${focus.label} 이탈`}</span><b>${event?.priority || statusLabel(focus.status)}</b>` : '<span>선택 기간 · 이상 없음</span><b>정상</b>';
    diagnosis.querySelector('.cause-row b').textContent = focus ? '관련 공정 지표 점검' : '추이 모니터링';
  }
}
function renderBriefNarrative(summaries, filters) {
  const focus = summaries.find((item) => item.status === 'abnormal') || summaries.find((item) => item.status === 'warning');
  const event = window.CogDataService.getEvents(filters)[0];
  const alert = document.querySelector('#brief .brief-full .alert');
  if (alert) alert.innerHTML = focus ? `<b>[${statusLabel(focus.status)}]</b> ${focus.label}가 관리기준을 벗어났습니다. ${event ? `${event.id} ${event.name} 구간의 관련 지표를 확인합니다.` : '관련 공정 지표를 우선 확인합니다.'}` : '<b>[정상]</b> 선택 기간에 관리기준을 벗어난 KPI가 없습니다.';
  const topic = document.querySelector('#brief .topic-chips button');
  if (topic) topic.textContent = event ? `${event.id} · ${event.name}` : focus ? `${focus.label} 이탈` : '선택 기간 정상';
  document.querySelectorAll('#brief .metric-strip').forEach((strip) => {
    const counts = { normal: summaries.filter((item) => item.status === 'normal').length, warning: summaries.filter((item) => item.status === 'warning').length, abnormal: summaries.filter((item) => item.status === 'abnormal').length };
    const values = [counts.normal, counts.warning, counts.abnormal];
    strip.querySelectorAll('span b').forEach((node, index) => { if (values[index] !== undefined) node.textContent = values[index]; });
  });
}
document.querySelector('#overview .kpi-detail-toggle')?.addEventListener('click', () => {
  kpiDetailState.overview = !kpiDetailState.overview;
  renderKpiTables(kpiDetailState.summaries);
});
document.querySelector('#brief .brief-kpi-detail-toggle')?.addEventListener('click', () => {
  kpiDetailState.brief = !kpiDetailState.brief;
  renderKpiTables(kpiDetailState.summaries);
});
function renderProfitBreakdown(filters) {
  const items = window.CogDataService.groupCostByItem(filters);
  const targets = document.querySelectorAll('#overview .profit-breakdown span, #brief .profit-breakdown span');
  targets.forEach((target, index) => {
    const item = items[index];
    if (!item) return;
    const title = target.firstChild;
    if (title?.nodeType === Node.TEXT_NODE) title.nodeValue = `${item.costItem} `;
    const amount = target.querySelector('b');
    if (amount) { amount.textContent = `${item.actualProfitImpact >= 0 ? '+' : ''}${item.actualProfitImpact.toFixed(1)}백만원`; amount.className = item.actualProfitImpact >= 0 ? 'positive' : 'red-text'; }
    const note = target.querySelector('small');
    if (note) note.textContent = `기준 대비 ${item.variance >= 0 ? '+' : ''}${item.variance.toFixed(1)}백만원`;
  });
  document.querySelectorAll('#overview .cost-list > div').forEach((target, index) => {
    const item = items[index];
    if (!item) return;
    target.querySelector('b').textContent = item.costItem;
    target.querySelector('span').textContent = `실제 ${item.actualUsage.toLocaleString()} · 목표 ${item.targetUsage.toLocaleString()} · ${item.variance >= 0 ? '+' : ''}${item.variance.toFixed(1)}백만원`;
    target.querySelector('strong').textContent = `${item.actualProfitImpact >= 0 ? '+' : ''}${item.actualProfitImpact.toFixed(1)}백만원`;
  });
}
function renderCostEventTable(filters) {
  const table = [...document.querySelectorAll('#cost table.simple-table')].find((item) => item.querySelector('tbody td b')?.textContent.includes('EX'));
  const body = table?.querySelector('tbody');
  if (!body) return;
  const events = window.CogDataService.getEvents(filters);
  const rows = events.map((event) => {
    const records = window.CogDataService.getCostRecords({ start: event.startAt, end: event.endAt });
    const grouped = window.CogDataService.groupCostByItem({ start: event.startAt, end: event.endAt });
    const amount = (keywords) => grouped.find((item) => keywords.some((keyword) => item.costItem.includes(keyword)))?.actualProfitImpact || 0;
    const total = records.reduce((sum, row) => sum + row.actualProfitImpact, 0);
    return `<tr><td><b>${event.id} · ${event.name}</b><small>영향 지표: ${(event.impactedMetrics || []).join(', ')}</small></td><td>${event.startAt.slice(5, 10).replace('-', '.')} ~ ${event.endAt.slice(5, 10).replace('-', '.')}</td><td>${amount(['가스', 'gas']).toFixed(1)}백만원</td><td>${amount(['약품', 'chemical']).toFixed(1)}백만원</td><td>${amount(['스팀', 'steam']).toFixed(1)}백만원</td><td><b>${total.toFixed(1)}백만원</b></td></tr>`;
  });
  body.innerHTML = rows.join('') || '<tr><td colspan="6">선택 기간에 해당하는 이벤트가 없습니다.</td></tr>';
}
function renderCostComposition(filters) {
  const items = window.CogDataService.groupCostByItem(filters);
  const donut = document.querySelector('#cost .donut');
  const list = document.querySelector('#cost .key-list');
  const total = items.reduce((sum, item) => sum + Math.abs(item.actualProfitImpact), 0);
  const first = items[0];
  if (donut) donut.querySelector('b').textContent = `${first && total ? Math.round(Math.abs(first.actualProfitImpact) / total * 100) : 0}%`;
  if (donut) donut.querySelector('span').textContent = first?.costItem || '선택 기간 데이터 없음';
  if (list) list.innerHTML = items.map((item) => `<li><i></i>${item.costItem} <b>${item.actualProfitImpact >= 0 ? '+' : ''}${item.actualProfitImpact.toFixed(1)}백만원</b></li>`).join('') || '<li>선택 기간 데이터 없음</li>';
}
function removeMeaninglessProfitBaselines() {
  document.querySelectorAll('#cost .profit-baseline, #cost .profit-baseline-label').forEach((element) => element.remove());
  document.querySelectorAll('#cost .profit-chart-summary em').forEach((element) => element.remove());
  document.querySelectorAll('#cost .profit-chart-summary small').forEach((element) => { element.textContent = '막대: 월별 실제 손익영향'; });
}
function syncSharedPeriodPresentation() {
  const { start, end } = dataDrivenState;
  document.querySelectorAll('#overview .overview-period-filter, #cost .impact-period-filter, #diagnosis .impact-period-filter, #processOverview .process-overview-filter').forEach((container) => {
    const inputs = [...container.querySelectorAll('[data-period-input]')];
    if (inputs.length < 2) return;
    const timeMode = Boolean(container.querySelector('[data-time-mode]')?.checked);
    inputs[0].value = timeMode ? `${start.slice(0, 10)}T07:00` : start.slice(0, 10);
    inputs[1].value = timeMode ? `${shiftCalendarDate(end, 1)}T06:59` : end.slice(0, 10);
  });
  document.querySelectorAll('#process .date-pair:not(.compare) input[data-period-input]').forEach((input, index) => {
    const timeMode = Boolean(document.querySelector('#process [data-time-mode]')?.checked);
    input.value = timeMode ? (index === 0 ? `${start.slice(0, 10)}T07:00` : `${shiftCalendarDate(end, 1)}T06:59`) : (index === 0 ? start.slice(0, 10) : end.slice(0, 10));
  });
  const briefPeriod = document.querySelector('#brief .page-head p');
  if (briefPeriod) briefPeriod.textContent = `기준일 ${window.CogMockData.metadata.referenceAt.slice(0, 10).replaceAll('-', '.')} · 조회 기간 ${start.replaceAll('-', '.')} ~ ${end.replaceAll('-', '.')}`;
}

function shiftPeriodStart(endValue, days) {
  const endDate = new Date(`${String(endValue).slice(0, 10)}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - days);
  return `${endDate.toISOString().slice(0, 10)}T07:00`;
}

function refreshDataDrivenViews(nextState = {}, options = {}) {
  Object.assign(dataDrivenState, nextState);
  const filters = { start: dataDrivenState.start, end: dataDrivenState.end, granularity: dataDrivenState.granularity || 'day', plant: dataDrivenState.plant, process: dataDrivenState.process, product: dataDrivenState.product };
  if (typeof profitGranularity !== 'undefined' && typeof profitImpactFilters !== 'undefined') {
    profitImpactFilters = { ...filters, granularity: filters.granularity === 'hour' ? 'hour' : (rangeDays(filters) <= 31 ? 'day' : 'month') };
    profitGranularity = profitImpactFilters.granularity;
    profitImpactData = window.CogDataService.getCostRecords(profitImpactFilters);
  }
  const summaries = window.CogDataService.getKpiSummaries(filters);
  const profit = window.CogDataService.getCostSummary(filters);
  renderKpiTables(summaries);
  renderOverviewSparks(summaries);
  renderBriefAndOverviewSummary(summaries, profit);
  renderOverviewNarrative(summaries, filters);
  renderBriefNarrative(summaries, filters);
  renderProfitBreakdown(filters);
  syncSharedPeriodPresentation();
  window.refreshProcessOverview?.();
  const activeView = document.querySelector('.view.active')?.id;
  if (activeView === 'standards' && typeof renderStandardsFromData === 'function') renderStandardsFromData(document.querySelector('#standards .search')?.value || '');
  if (activeView === 'brief' && typeof renderCopilotTopic === 'function') renderCopilotTopic('qualityContent');
  if (activeView === 'process') { if (typeof runProcessComparison === 'function') runProcessComparison(); if (typeof renderProcessStandardAnalysis === 'function') renderProcessStandardAnalysis(); }
  if (activeView === 'cost' && typeof renderCostFromData === 'function') { renderCostFromData(filters); renderCostEventTable(filters); renderCostComposition(filters); removeMeaninglessProfitBaselines(); }
  if (activeView === 'diagnosis' && typeof renderDiagnosisFromEvent === 'function') renderDiagnosisFromEvent(dataDrivenState.selectedEventId, filters);
  return { summaries, profit };
}
document.querySelectorAll('.impact-period-filter').forEach((filter) => {
  const inputs = filter.querySelectorAll('input');
  const applyPeriod = () => {
    const period = readPeriodRange(filter, [...filter.querySelectorAll('[data-period-input]')]);
    if (filter.closest('#cost')) {
      profitImpactFilters = period;
      profitImpactData = window.CogDataService.getCostRecords(period).map((row) => ({ ...row, month: Number(row.period.slice(5, 7)) }));
      window.refreshProfitImpactView?.(dataDrivenState.selectedProfitItem);
    }
    refreshDataDrivenViews(period);
    if (filter.closest('#diagnosis')) renderDiagnosisFromEvent(dataDrivenState.selectedEventId, period);
  };
  filter.querySelector('.primary')?.addEventListener('click', applyPeriod);
  filter.querySelectorAll('.impact-quick button').forEach((button, index) => button.addEventListener('click', () => {
    const end = dataDrivenState.end?.slice(0, 10) || window.CogMockData.metadata.referenceAt.slice(0, 10); const days = [1, 7, 30][index];
    const periodInputs = [...filter.querySelectorAll('[data-period-input]')];
    periodInputs[0].value = shiftPeriodStart(end, days).slice(0, 10); periodInputs[1].value = end;
    applyPeriod();
  }));
});
window.CogUiState = dataDrivenState;
window.refreshDataDrivenViews = refreshDataDrivenViews;
refreshDataDrivenViews();

const referenceAt = window.CogMockData.metadata.referenceAt;
document.querySelector('#overview .filters [data-reference-button]')?.replaceChildren(`▣ 기준일 ${referenceAt.slice(0, 10).replaceAll('-', '.')}`);
const briefPeriodText = document.querySelector('#brief .page-head p');
if (briefPeriodText) briefPeriodText.textContent = `기준일 ${referenceAt.slice(0, 10).replaceAll('-', '.')} · 조회 기간 ${dataDrivenState.start.replaceAll('-', '.')} ~ ${dataDrivenState.end.replaceAll('-', '.')}`;

// Process overview uses the same daily-observation payload as the KPI cards.
const processOverviewBridge = document.querySelector('#processOverview');
if (processOverviewBridge) {
  const metricDefs = window.CogMockData.metricDefinitions;
  const grid = processOverviewBridge.querySelector('.process-kpi-grid');
  const checks = processOverviewBridge.querySelector('.metric-checks');
  const inputs = [...processOverviewBridge.querySelectorAll('[data-period-input]')];
  const table = processOverviewBridge.querySelector('.process-data-table');
  const renderProcessOverview = () => {
    const filters = readPeriodRange(processOverviewBridge, inputs);
    const summaries = window.CogDataService.getKpiSummaries(filters).filter((item) => metricDefs.some((definition) => definition.id === item.id));
    const selectedInputs = [...checks.querySelectorAll('input:checked')];
    const selectedIds = selectedInputs.map((input) => input.value);
    processOverviewBridge.querySelector('.visible-count').textContent = `${selectedInputs.length}개`;
    grid.innerHTML = summaries.filter((item) => !selectedIds.length || selectedIds.includes(item.id)).map((item) => `<article class="process-kpi-card ${statusClass(item.status)}"><div><b>${item.label}</b><strong>${formatMetricValue(item)}</strong></div>${trendSvg(item)}<small>${standardText(item)}</small><span>${statusLabel(item.status)}</span></article>`).join('');
    const observations = window.CogDataService.getObservations(filters);
    const visible = summaries.filter((item) => !selectedIds.length || selectedIds.includes(item.id));
    table.querySelector('thead').innerHTML = `<tr><th>일자</th>${visible.map((item) => `<th>${item.label}</th>`).join('')}</tr><tr class="process-table-units"><th>단위</th>${visible.map((item) => `<th>${item.unit}</th>`).join('')}</tr>`;
    table.querySelector('tbody').innerHTML = observations.map((row) => `<tr><td>${row.period}</td>${visible.map((item) => `<td>${row.metrics[item.id].toLocaleString(undefined, { maximumFractionDigits: item.decimals })}</td>`).join('')}</tr>`).join('');
  };
  checks.innerHTML = metricDefs.map((item) => `<label><input type="checkbox" value="${item.id}" checked>${item.label}</label>`).join('');
  checks.addEventListener('change', renderProcessOverview);
  processOverviewBridge.querySelector('[data-select-all]')?.addEventListener('click', () => {
    checks.querySelectorAll('input').forEach((input) => { input.checked = true; });
    renderProcessOverview();
  });
  processOverviewBridge.querySelector('[data-process-query]')?.addEventListener('click', () => { renderProcessOverview(); refreshDataDrivenViews(readPeriodRange(processOverviewBridge, inputs)); });
  inputs[0].value = dataDrivenState.start.slice(0, 10);
  inputs[1].value = dataDrivenState.end.slice(0, 10);
  renderProcessOverview();
  window.refreshProcessOverview = renderProcessOverview;
}

function openProcessOverviewForState(event) {
  event?.preventDefault();
  const target = document.querySelector('#processOverview');
  if (!target) return;
  const inputs = [...target.querySelectorAll('[data-period-input]')];
  if (inputs.length >= 2) {
    inputs[0].value = dataDrivenState.start.slice(0, 10);
    inputs[1].value = dataDrivenState.end.slice(0, 10);
  }
  showView('processOverview');
  target.querySelector('[data-process-query]')?.click();
}
document.querySelectorAll('#overview [data-view="process"], #brief [data-view="process"]').forEach((button) => button.addEventListener('click', openProcessOverviewForState));

// Comparison/standard-analysis query controls share the selected period with all other views.
document.querySelector('#process [data-process-query]')?.addEventListener('click', () => {
  const processInputs = [...document.querySelectorAll('#process input[data-period-input]')];
  if (processInputs.length >= 2) refreshDataDrivenViews(readPeriodRange(document.querySelector('#process'), processInputs.slice(0, 2)));
});

// Overview uses the same date state as all sub-screens; this control only adds the requested period selector.
const overviewHead = document.querySelector('#overview .page-head');
if (overviewHead) {
  const overviewPeriodFilter = document.querySelector('#overview .overview-period-filter') || document.createElement('article');
  overviewPeriodFilter.className = 'card overview-period-filter';
  overviewPeriodFilter.innerHTML = '<div class="impact-period-label"><b>통합현황 조회 기간</b><span>선택 기간의 KPI·손익영향을 함께 조회합니다.</span></div><div class="impact-period-inputs"><label>시작<input data-period-input type="date" value="2025-12-31"></label><label>종료<input data-period-input type="date" value="2025-12-31"></label><label class="time-mode"><input data-time-mode type="checkbox"> 시간 단위 조회</label></div><div class="impact-quick"><button type="button" data-overview-range="1">전일</button><button type="button" data-overview-range="7">전 7일</button><button type="button" data-overview-range="30">전 30일</button></div><button class="primary" type="button">조회</button><small class="impact-period-selected"></small>';
  overviewHead.insertAdjacentElement('afterend', overviewPeriodFilter);
  const inputs = [...overviewPeriodFilter.querySelectorAll('[data-period-input]')];
  inputs[0].value = dataDrivenState.start.slice(0, 10);
  inputs[1].value = dataDrivenState.end.slice(0, 10);
  const applyOverviewRange = () => {
    const state = readPeriodRange(overviewPeriodFilter, inputs);
    overviewPeriodFilter.querySelector('.impact-period-selected').textContent = `적용 기간: ${state.start.replaceAll('-', '.')} ~ ${state.end.replaceAll('-', '.')}`;
    refreshDataDrivenViews(state);
  };
  overviewPeriodFilter.querySelector('.primary').addEventListener('click', applyOverviewRange);
  overviewPeriodFilter.querySelectorAll('[data-overview-range]').forEach((button) => button.addEventListener('click', () => {
    const end = dataDrivenState.end?.slice(0, 10) || window.CogMockData.metadata.referenceAt.slice(0, 10);
    inputs[0].value = shiftPeriodStart(end, Number(button.dataset.overviewRange)).slice(0, 10); inputs[1].value = end; applyOverviewRange();
  }));
  installPeriodMode(overviewPeriodFilter, inputs);
  applyOverviewRange();
}

const processAnalysis = document.querySelector('#process');
if (processAnalysis) installPeriodMode(processAnalysis, [...processAnalysis.querySelectorAll('input[data-period-input]')]);
function syncProcessMetricChips() {
  if (!processAnalysis) return;
  const chipBox = processAnalysis.querySelector('.chips');
  const definitions = window.CogMockData.metricDefinitions;
  chipBox.innerHTML = processAnalysisState.metricIds.map((metricId) => {
    const definition = definitions.find((item) => item.id === metricId);
    return `<span data-process-metric="${metricId}">${definition.label} <button type="button" aria-label="${definition.label} 제거">×</button></span>`;
  }).join('') + '<button type="button" data-add-process-metric>+ 지표 추가</button>';
  chipBox.querySelectorAll('[data-process-metric] button').forEach((button) => button.addEventListener('click', () => {
    const metricId = button.closest('[data-process-metric]').dataset.processMetric;
    processAnalysisState.metricIds = processAnalysisState.metricIds.filter((item) => item !== metricId);
    syncProcessMetricChips(); runProcessComparison(); renderProcessStandardAnalysis();
  }));
  chipBox.querySelector('[data-add-process-metric]')?.addEventListener('click', () => {
    // Each select is inside its own label, so :last-of-type matched the group
    // select as well. Read the second control explicitly: this is the metric.
    const [, select] = processAnalysis.querySelectorAll('.select-row select');
    if (!select) return;
    const metricId = select.value;
    if (!processAnalysisState.metricIds.includes(metricId)) processAnalysisState.metricIds.push(metricId);
    syncProcessMetricChips(); runProcessComparison(); renderProcessStandardAnalysis();
  });
}
function initialiseProcessMetricControls() {
  if (!processAnalysis) return;
  const [groupSelect, metricSelect] = processAnalysis.querySelectorAll('.select-row select');
  const definitions = window.CogMockData.metricDefinitions;
  // Read both select lists from the shared metric catalogue: no process variable is screen-local.
  const kpiMetricIds = new Set(['purifiedVolume', 'aUnit', 'bUnit', 'cUnit', 'chemicalA', 'chemicalB', 'steamUsage', 'qualityContent']);
  const groups = {
    '품질 · 효율성 지표': definitions.filter((definition) => kpiMetricIds.has(definition.id)).map((definition) => definition.id),
    '공정 변수': definitions.filter((definition) => !kpiMetricIds.has(definition.id)).map((definition) => definition.id),
  };
  groupSelect.innerHTML = Object.keys(groups).map((label) => `<option value="${label}">${label}</option>`).join('');
  const syncMetricOptions = () => {
    metricSelect.innerHTML = groups[groupSelect.value].map((metricId) => {
      const definition = definitions.find((item) => item.id === metricId);
      return `<option value="${metricId}">${definition.label}</option>`;
    }).join('');
  };
  groupSelect.addEventListener('change', syncMetricOptions);
  groupSelect.value = '공정 변수';
  syncMetricOptions();
  metricSelect.value = 'gasOutletTemp';
  syncProcessMetricChips();
}
function applyProcessQuickRange(kind) {
  if (!processAnalysis) return;
  const inputs = [...processAnalysis.querySelectorAll('input[data-period-input]')];
  if (inputs.length < 4) return;
  const endDate = new Date(`${(inputs[1].value || dataDrivenState.end).slice(0, 10)}T00:00:00Z`);
  const iso = (date) => `${date.toISOString().slice(0, 10)}T07:00`;
  const endOfDay = (date) => `${date.toISOString().slice(0, 10)}T06:59`;
  const shift = (date, days) => { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; };
  let baseStart;
  let baseEnd;
  let compareStart;
  let compareEnd;
  if (kind.includes('전월')) {
    baseStart = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - 1, 1));
    baseEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 0));
    compareStart = new Date(Date.UTC(baseStart.getUTCFullYear(), baseStart.getUTCMonth() - 1, 1));
    compareEnd = new Date(Date.UTC(baseStart.getUTCFullYear(), baseStart.getUTCMonth(), 0));
  } else if (kind.includes('전년')) {
    baseStart = new Date(Date.UTC(endDate.getUTCFullYear() - 1, endDate.getUTCMonth(), 1));
    baseEnd = new Date(Date.UTC(endDate.getUTCFullYear() - 1, endDate.getUTCMonth() + 1, 0));
    compareStart = new Date(Date.UTC(endDate.getUTCFullYear() - 2, endDate.getUTCMonth(), 1));
    compareEnd = new Date(Date.UTC(endDate.getUTCFullYear() - 2, endDate.getUTCMonth() + 1, 0));
  } else if (kind.includes('전분기')) {
    const quarter = Math.floor(endDate.getUTCMonth() / 3) - 1;
    const year = endDate.getUTCFullYear() + Math.floor(quarter / 4);
    const month = ((quarter % 4) + 4) % 4 * 3;
    baseStart = new Date(Date.UTC(year, month, 1));
    baseEnd = new Date(Date.UTC(year, month + 3, 0));
    compareStart = new Date(Date.UTC(year - 1, month, 1));
    compareEnd = new Date(Date.UTC(year - 1, month + 3, 0));
  } else {
    baseEnd = endDate;
    baseStart = shift(endDate, -1);
    compareEnd = shift(baseStart, -1);
    compareStart = shift(compareEnd, -1);
  }
  const timeMode = Boolean(processAnalysis.querySelector('[data-time-mode]')?.checked);
  [iso(baseStart), endOfDay(baseEnd), iso(compareStart), endOfDay(compareEnd)].forEach((value, index) => { inputs[index].value = timeMode ? value : value.slice(0, 10); });
  processAnalysis.querySelectorAll('.quick button').forEach((button) => button.classList.toggle('selected', button.textContent.trim() === kind));
  runProcessComparison({ syncSharedViews: true });
}
function renderProcessRecentTrend(series, status) {
  const points = series.slice(-8);
  if (!points.length) return '<span class="trend-empty">데이터 없음</span>';
  const min = Math.min(...points);
  const spread = Math.max(...points) - min || 1;
  const path = points.map((value, index) => `${index ? 'L' : 'M'}${4 + index * (136 / Math.max(points.length - 1, 1))} ${35 - ((value - min) / spread) * 27}`).join(' ');
  return `<div class="recent-trend ${status}"><svg viewBox="0 0 144 42" aria-label="최근 추이"><line x1="0" y1="35" x2="144" y2="35"/><path d="${path}"/></svg><small>최근 ${points.length}개 시점</small></div>`;
}

function runProcessComparison({ syncSharedViews = false } = {}) {
  if (!processAnalysis) return;
  const inputs = [...processAnalysis.querySelectorAll('input[data-period-input]')];
  const timeMode = Boolean(processAnalysis.querySelector('[data-time-mode]')?.checked);
  const base = timeMode ? { start: inputs[0].value, end: inputs[1].value, granularity: 'hour' } : { start: inputs[0].value, end: inputs[1].value, granularity: 'day' };
  const compare = timeMode ? { start: inputs[2].value, end: inputs[3].value, granularity: 'hour' } : { start: inputs[2].value, end: inputs[3].value, granularity: 'day' };
  const definitions = processAnalysisState.metricIds;
  const values = (range, metricId) => window.CogDataService.getMetricSeries(metricId, range).map((row) => row.value);
  const average = (items) => items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : 0;
  const body = processAnalysis.querySelector('.result tbody');
  if (body) body.innerHTML = definitions.map((metricId) => {
    const definition = window.CogMockData.metricDefinitions.find((item) => item.id === metricId);
    const baseValue = average(values(base, metricId)); const compareValue = average(values(compare, metricId)); const difference = baseValue - compareValue;
    const digits = definition.decimals; const cls = difference > 0 && metricId !== 'purifiedVolume' ? 'red-text' : 'positive';
    return `<tr><td><b>${definition.label}</b><small>${metricId}</small></td><td>${baseValue.toFixed(digits)} ${definition.unit}</td><td>${compareValue.toFixed(digits)} ${definition.unit}</td><td class="${cls}">${difference >= 0 ? '+' : ''}${difference.toFixed(digits)} ${definition.unit}</td><td><span class="${cls}">${difference >= 0 ? '↗ 증가' : '↘ 감소'}</span></td></tr>`;
  }).join('');
  body?.querySelectorAll('tr').forEach((row, index) => {
    const metricId = definitions[index];
    const definition = window.CogMockData.metricDefinitions.find((item) => item.id === metricId);
    const series = values(base, metricId);
    const valueDelta = Number.parseFloat(row.children[3]?.textContent) || 0;
    const status = valueDelta > 0 && metricId !== 'purifiedVolume' ? 'danger' : 'positive';
    row.children[4].innerHTML = renderProcessRecentTrend(series, status);
    row.children[4].setAttribute('aria-label', `${definition?.label || metricId} 최근 추이`);
  });
  if (syncSharedViews) refreshDataDrivenViews(base);
}
if (processAnalysis) {
  initialiseProcessMetricControls();
  processAnalysis.querySelectorAll('.quick button').forEach((button) => button.addEventListener('click', () => applyProcessQuickRange(button.textContent.trim())));
  processAnalysis.querySelector('.primary.full')?.addEventListener('click', () => runProcessComparison({ syncSharedViews: true }));
  processAnalysis.querySelector('.result .card-title .primary')?.addEventListener('click', (event) => {
    const note = processAnalysis.querySelector('.analysis-note');
    const rows = [...processAnalysis.querySelectorAll('.result tbody tr')];
    const points = rows.map((row, index) => ({ label: row.querySelector('b')?.textContent || '', value: Number.parseFloat(row.children[3]?.textContent) || 0, index }));
    const max = Math.max(...points.map((item) => Math.abs(item.value)), 1);
    note.innerHTML = `<b>비교 그래프</b><svg viewBox="0 0 420 90" aria-label="선택 지표 비교 차이 그래프">${points.map((item) => `<rect x="${30 + item.index * 120}" y="${item.value >= 0 ? 45 - Math.abs(item.value) / max * 35 : 45}" width="45" height="${Math.abs(item.value) / max * 35}" class="${item.value >= 0 ? 'profit-bar negative' : 'profit-bar positive'}"/><text x="${30 + item.index * 120}" y="82">${item.label}</text>`).join('')}</svg>`;
    event.currentTarget.textContent = event.currentTarget.textContent.includes('닫기') ? '비교 그래프 보기 ▾' : '비교 그래프 닫기 ▴';
  });
  runProcessComparison();
}

function renderProcessStandardAnalysis() {
  const target = document.querySelector('#process .standard-comparison-result');
  if (!target) return;
  const processInputs = [...document.querySelectorAll('#process input[data-period-input]')];
  const filters = processInputs.length >= 2 ? { start: processInputs[0].value, end: processInputs[1].value } : dataDrivenState;
  const summaries = window.CogDataService.getKpiSummaries(filters).filter((item) => processAnalysisState.metricIds.includes(item.id));
  const rows = summaries.map((item) => `<tr><td><b>${item.label}</b></td><td>${formatMetricValue(item)}</td><td><b>${item.standard.effectiveFrom}</b></td><td>${standardText(item)}</td><td>${item.standard.warningMax !== undefined ? `상한 ${formatStandardValue(item.standard.warningMax, item)}` : `하한 ${formatStandardValue(item.standard.warningMin, item)}`}</td><td><span class="status ${statusClass(item.status)}">${statusLabel(item.status)}</span></td><td class="${item.status === 'abnormal' ? 'red-text' : item.status === 'warning' ? 'orange' : 'positive'}">${formatStandardVariance(item)}</td></tr>`).join('');
  const costItems = window.CogDataService.groupCostByItem(filters);
  const costRows = managementCostMetricMap.map(({ metricId, costItemKeyword }) => {
    const summary = summaries.find((item) => item.id === metricId);
    const cost = costItems.find((item) => item.costItem.includes(costItemKeyword));
    if (!summary?.hasData) return '';
    const delta = summary.targetVariance;
    return `<tr><td><b>${summary.label}</b></td><td>${formatStandardValue(summary.standard.target, summary)}</td><td>${formatStandardValue(summary.value, summary)}</td><td class="${summary.status === 'normal' ? 'positive' : summary.status === 'warning' ? 'orange' : 'red-text'}">${delta >= 0 ? '+' : ''}${formatStandardValue(delta, summary)}</td><td class="${(cost?.variance || 0) >= 0 ? 'positive' : 'red-text'}">${(cost?.variance || 0) >= 0 ? '+' : ''}${(cost?.variance || 0).toFixed(1)}백만원</td></tr>`;
  }).join('');
  target.innerHTML = `<div class="card-title"><div><h2>관리기준 대비 분석</h2><p>선택 기간 실적을 적용 시점별 관리기준과 비교합니다.</p></div></div><div class="standard-application"><b>기준 적용 안내</b><span>기준 변경일 이후의 실적에는 해당 버전을 적용하고, 과거 실적은 당시 기준으로 판정합니다.</span></div><div class="standard-table-scroll"><table class="simple-table compact"><thead><tr><th>지표</th><th>선택 기간 실적</th><th>적용 기준일</th><th>정상 범위</th><th>주의 기준</th><th>판정</th><th>기준 대비</th></tr></thead><tbody>${rows}</tbody></table></div><h3 class="usage-analysis-title">관리기준·손익 영향</h3><div class="standard-table-scroll"><table class="simple-table compact"><thead><tr><th>관리 항목</th><th>관리 기준</th><th>선택 기간 실적</th><th>기준 대비 증감</th><th>관련 손익 영향</th></tr></thead><tbody>${costRows}</tbody></table></div>`;
}
renderProcessStandardAnalysis();

function renderStandardsFromData(searchText = '') {
  const standardsView = document.querySelector('#standards');
  const table = standardsView?.querySelector('.standards-grid .card table tbody');
  if (!table) return;
  const term = searchText.trim().toLowerCase();
  const latestDate = dataDrivenState.end;
  const rows = window.CogMockData.metricDefinitions
    .map((definition) => ({ definition, standard: window.CogDataService.getActiveStandard(definition.id, latestDate) }))
    .filter(({ definition, standard }) => standard && (!term || definition.label.toLowerCase().includes(term) || definition.id.toLowerCase().includes(term)))
    .map(({ definition, standard }) => `<tr><td>${definition.id.includes('quality') ? '품질' : definition.id.includes('steam') ? '에너지' : '공정'}</td><td><b>${definition.label}</b><small>적용 ${standard.effectiveFrom}</small></td><td>${standard.normalMin !== undefined ? `${standard.normalMin} ~ ${standard.normalMax}` : `상한 ${standard.normalMax}`}${definition.unit}</td><td>${standard.warningMax !== undefined ? `상한 ${standard.warningMax}` : `하한 ${standard.warningMin}`}${definition.unit}</td><td>${standard.warningMax !== undefined ? `초과 시 이상` : `미만 시 이상`}</td></tr>`).join('');
  table.innerHTML = rows || '<tr><td colspan="5">검색 결과가 없습니다.</td></tr>';
  const history = standardsView.querySelectorAll('.standards-grid .card table tbody')[1];
  if (history) history.innerHTML = window.CogMockData.standards.slice().sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)).map((standard) => {
    const definition = window.CogMockData.metricDefinitions.find((item) => item.id === standard.metricId);
    return `<tr><td><b>${standard.effectiveFrom === '2024-01-01' ? 'v1.0' : 'v1.1'}</b></td><td>${standard.effectiveFrom}</td><td>${definition.label}</td><td>관리 기준 적용</td><td>기준 정비</td></tr>`;
  }).join('');
}
const standardSearch = document.querySelector('#standards .search');
standardSearch?.addEventListener('input', () => renderStandardsFromData(standardSearch.value));
renderStandardsFromData();

function renderCopilotTopic(metricId) {
  const topicConfig = {
    qualityContent: { title: 'EX07 · 품질함량 상승', conclusion: '품질함량 상승은 스팀 공급량 저하와 열교환 상태 변화의 연관 패턴입니다.' },
    steamUsage: { title: '스팀 사용량 변화', conclusion: '스팀 사용량은 목표 및 관리기준 대비 수준을 우선 확인해야 합니다.' },
    gasOutletTemp: { title: '가스 출구온도', conclusion: '출구온도 변화와 설비 차압·스팀 공급량을 함께 점검해야 합니다.' },
  };
  const config = topicConfig[metricId] || topicConfig.qualityContent;
  const summary = window.CogDataService.getKpiSummaries(dataDrivenState).find((item) => item.id === metricId);
  if (!summary) return;
  const copilot = document.querySelector('#brief .copilot');
  if (!copilot) return;
  const periodIssues = window.CogDataService.getPeriodIssues(dataDrivenState);
  if (!periodIssues.length) {
    const issue = copilot.querySelector('.copilot-grid > div:first-child');
    if (issue) issue.innerHTML = '<h3>주요 핵심 이슈</h3><p>선택 기간에 관리기준 이탈이나 이상 항목이 없습니다.</p><div class="inline-standard"><b>정상 운영</b></div><h3>결론</h3><p>선택 기간의 모든 지표가 관리기준 범위 안에 있습니다.</p>';
    const evidence = copilot.querySelector('.copilot-grid > div:last-child');
    if (evidence) evidence.innerHTML = '<h3>확인 근거</h3><div class="evidence"><b>해당 기간 이상 없음</b><p>선택 기간의 모든 지표가 적용 관리기준 안에 있습니다.</p></div>';
    const related = document.querySelector('#brief .related-metrics');
    if (related) related.innerHTML = [summary, ...window.CogDataService.getKpiSummaries(dataDrivenState).filter((item) => ['steamM01', 'steamM02', 'steamM03', 'steamM04', 'steamM05', 'steamM06', 'gasOutletTemp', 'equipmentPressure'].includes(item.id))].map((item) => `<div class="related ${statusClass(item.status)}"><b>${item.label}</b><strong>${formatMetricValue(item)}</strong>${trendSvg(item)}<small>${standardText(item)}</small></div>`).join('');
    return;
  }
  const issue = copilot.querySelector('.copilot-grid > div:first-child');
  if (issue) issue.innerHTML = `<h3>주요 핵심 이슈</h3><p>${config.title}의 현재값과 관리기준 이탈 수준을 확인합니다.</p><div class="inline-standard"><span>현재값 <b>${formatMetricValue(summary)}</b></span><span>관리 기준 <b>${standardText(summary)}</b></span><span>기준 대비 <b class="${summary.status === 'abnormal' ? 'red-text' : summary.status === 'warning' ? 'orange' : 'positive'}">${summary.variance >= 0 ? '+' : ''}${summary.variance}${summary.unit}</b></span></div><h3>결론</h3><p>${config.conclusion}</p><p class="disclaimer">예상 원인·점검 후보이며 확정 원인이 아닙니다.</p>`;
  const evidence = copilot.querySelector('.copilot-grid > div:last-child');
  if (evidence) evidence.innerHTML = `<h3>확인 근거</h3><ul><li>${summary.label}: 현재 ${formatMetricValue(summary)}, ${standardText(summary)} 대비 <b>${summary.variance >= 0 ? '+' : ''}${summary.variance}${summary.unit}</b></li><li>목표 ${summary.standard.target}${summary.unit} 대비 <b>${summary.targetVariance >= 0 ? '+' : ''}${summary.targetVariance}${summary.unit}</b></li><li>적용 기준일: <b>${summary.standard.effectiveFrom}</b></li></ul><h3>권장 점검</h3><ol><li>${summary.label} 계측값과 시간대별 편차 확인</li><li>연관 공정 변수 및 설비 상태 확인</li><li>다음 조업일까지 관리기준 복귀 여부 모니터링</li></ol>`;
  const related = document.querySelector('#brief .related-metrics');
  if (related) related.innerHTML = [summary, ...window.CogDataService.getKpiSummaries(dataDrivenState).filter((item) => ['steamM01', 'steamM02', 'steamM03', 'steamM04', 'steamM05', 'steamM06', 'gasOutletTemp', 'equipmentPressure'].includes(item.id))].map((item) => `<div class="related ${statusClass(item.status)}"><b>${item.label}</b><strong>${formatMetricValue(item)}</strong>${trendSvg(item)}<small>${standardText(item)}</small></div>`).join('');
}
document.querySelectorAll('#brief .topic-chips button').forEach((button, index) => button.addEventListener('click', () => {
  const metricId = ['qualityContent', 'steamUsage', 'gasOutletTemp'][index];
  renderCopilotTopic(metricId);
}));
renderCopilotTopic('qualityContent');

function renderDiagnosisCandidateCard(diagnosis, event, primary) {
  const candidateCard = diagnosis.querySelector('.two-col .card:last-child');
  if (!candidateCard) return;
  if (!primary) {
    candidateCard.innerHTML = '<h2>예상 원인·점검 후보</h2><div class="evidence"><b>점검 후보 없음</b><p>선택 기간에 이상 이벤트 또는 관리기준 이탈이 없어 예상 원인과 권장 점검을 제시하지 않습니다.</p></div>';
    return;
  }
  const candidate = event?.inspectionPriority || `${primary.label} 관련 공정 변수 및 설비 상태 확인`;
  const note = '선택 기간의 관리기준 이탈 패턴을 기준으로 한 점검 후보이며 확정 원인이 아닙니다.';
  candidateCard.innerHTML = `<h2>예상 원인·점검 후보</h2><div class="evidence"><b>${candidate}</b><p>${note}</p></div>`;
}

function renderDiagnosisFromEvent(eventId = dataDrivenState.selectedEventId, filters = { start: dataDrivenState.start, end: dataDrivenState.end }) {
  const diagnosis = document.querySelector('#diagnosis');
  if (!diagnosis) return;
  const summaries = window.CogDataService.getKpiSummaries(filters);
  const issueSummaries = window.CogDataService.getPeriodIssues(filters);
  const events = window.CogDataService.getEvents(filters);
  const event = events.find((item) => item.id === eventId) || events[0];
  if (event) dataDrivenState.selectedEventId = event.id;
  const findingIds = issueSummaries.map((item) => item.id);
  const findings = findingIds.map((id) => summaries.find((item) => item.id === id)).filter(Boolean);
  const primary = findings[0];
  const chip = diagnosis.querySelector('.event-chip');
  if (chip) chip.textContent = event ? `이벤트 ${event.id} ▾` : findings.length ? `이상 항목 ${findings.length}건 ▾` : '이상 없음';
  const period = diagnosis.querySelector('.page-head p');
  if (period) period.textContent = `${filters.start.replaceAll('-', '.')} 07:00 ~ ${filters.end.replaceAll('-', '.')} 07:00`;
  const hero = diagnosis.querySelector('.hero');
  renderDiagnosisCandidateCard(diagnosis, event, primary);
  const breach = diagnosis.querySelector('.breach-summary');
  if (!primary) {
    if (hero) hero.innerHTML = '<div class="warning-icon">✓</div><div><h2>이상 없음</h2><p>선택한 조회기간에 관리기준 이탈 또는 등록된 이상 이벤트가 없습니다.</p></div><div class="hero-stat"><span>조회 결과</span><b>정상</b></div><div class="hero-stat"><span>이상 항목</span><b>0건</b></div>';
    if (breach) breach.innerHTML = '<div><span>조회 결과</span><b>이상 없음</b><small>선택 기간 내 점검 대상이 없습니다.</small></div>';
    const trend = diagnosis.querySelector('.trend-summary');
    if (trend) trend.innerHTML = '<span><b>조회 기간 내 관리기준 이탈 없음</b></span>';
    diagnosis.querySelector('.diagnosis-chart .actual-line')?.setAttribute('d', '');
    diagnosis.querySelector('.diagnosis-chart .point-label')?.replaceChildren('—');
    const related = diagnosis.querySelector('.related-metrics');
    if (related) related.innerHTML = '<div class="related normal"><b>연관 지표 현황</b><strong>정상</strong><small>선택 기간 내 이상 항목이 없습니다.</small></div>';
    const evidence = diagnosis.querySelector('.two-col .card:first-child');
    if (evidence) evidence.innerHTML = '<h2>이상 확인 근거</h2><div class="evidence"><b>이상 없음</b><p>선택 기간의 모든 지표가 적용 관리기준 내에 있습니다.</p></div>';
    const checklist = diagnosis.querySelector('.checklist ol');
    if (checklist) checklist.innerHTML = '<li>정상 운영 상태를 유지하고 다음 조회 주기에 다시 확인합니다.</li>';
    return;
  }
  if (hero) {
    hero.querySelector('h2').innerHTML = event ? `${event.id} <b>${event.name}</b>` : `기간 이탈 <b>${primary.label}</b>`;
    hero.querySelector('p').textContent = event ? `${event.name}와 연관된 공정 변수 패턴을 기준으로 점검 후보를 제시합니다.` : `${primary.label}의 관리기준 이탈이 선택 기간에 확인되었습니다.`;
    const stats = hero.querySelectorAll('.hero-stat b');
    if (stats[0]) stats[0].textContent = primary.label;
    if (stats[1]) stats[1].textContent = event?.priority || (primary.status === 'abnormal' ? '높음' : '중간');
  }
  if (breach) breach.innerHTML = findings.map((item) => `<div class="${statusClass(item.status)}"><span>${item.status === 'normal' ? '연관 항목' : '초과 항목'}</span><b>${item.label}</b><small>${formatMetricValue(item)} · 기준 대비 ${item.variance >= 0 ? '+' : ''}${item.variance}${item.unit}</small></div>`).join('');
  const trend = diagnosis.querySelector('.trend-summary');
  if (trend) trend.innerHTML = `<span>관리 기준 <b>${standardText(primary)}</b></span><span>목표 <b>${primary.standard.target}${primary.unit}</b></span><span>현재 실적 <b class="${primary.status === 'abnormal' ? 'red-text' : primary.status === 'warning' ? 'orange' : 'positive'}">${formatMetricValue(primary)}</b></span><span>기준 대비 <b class="${primary.status === 'abnormal' ? 'red-text' : primary.status === 'warning' ? 'orange' : 'positive'}">${primary.variance >= 0 ? '+' : ''}${primary.variance}${primary.unit}</b></span>`;
  const series = primary.series.slice(-8).map((item) => item.value);
  const low = Math.min(...series), spread = Math.max(...series) - low || 1;
  const path = series.map((value, index) => `${index ? 'L' : 'M'}${index * (760 / (series.length - 1 || 1))} ${155 - ((value - low) / spread) * 120}`).join(' ');
  const chart = diagnosis.querySelector('.diagnosis-chart svg');
  if (chart) {
    chart.querySelector('.actual-line')?.setAttribute('d', path);
    chart.querySelector('.point-label')?.replaceChildren(formatMetricValue(primary));
  }
  const related = diagnosis.querySelector('.related-metrics');
  if (related) related.innerHTML = findingIds.map((id) => {
    const item = summaries.find((summary) => summary.id === id); if (!item) return '';
    return `<div class="related ${statusClass(item.status)}"><b>${item.label}</b><strong>${formatMetricValue(item)}</strong>${trendSvg(item)}<small>${standardText(item)}</small></div>`;
  }).join('');
  const evidence = diagnosis.querySelector('.two-col .card:first-child');
  if (evidence) evidence.innerHTML = `<h2>이상 확인 근거</h2>${findings.map((item) => `<div class="evidence"><b>${item.label} · 기준 대비 ${item.variance >= 0 ? '+' : ''}${item.variance}${item.unit}</b><p>${standardText(item)} 기준으로 ${statusLabel(item.status)} 상태입니다.</p></div>`).join('')}`;
  const checklist = diagnosis.querySelector('.checklist ol');
  if (checklist) checklist.innerHTML = findings.map((item) => `<li>${item.label} 계측값과 시간대별 편차를 확인합니다.</li>`).join('') + `<li>다음 조업일까지 ${primary.label}의 관리기준 복귀 여부를 모니터링합니다.</li>`;
}
function selectDiagnosisEvent() {
  const eventIds = window.CogDataService.getEvents(dataDrivenState).map((item) => item.id);
  if (!eventIds.length) return;
  const next = (eventIds.indexOf(dataDrivenState.selectedEventId) + 1) % eventIds.length;
  renderDiagnosisFromEvent(eventIds[next], dataDrivenState);
}
document.querySelector('#diagnosis .event-chip')?.addEventListener('click', selectDiagnosisEvent);

function renderCostFromData(filters = { start: dataDrivenState.start, end: dataDrivenState.end }) {
  const cost = document.querySelector('#cost');
  if (!cost) return;
  profitImpactFilters = filters;
  profitGranularity = rangeDays(filters) <= 31 ? 'day' : 'month';
  document.querySelectorAll('#cost .impact-composition-card [data-profit-granularity]').forEach((button) => button.classList.toggle('selected', button.dataset.profitGranularity === profitGranularity));
  const periodRecords = window.CogDataService.getCostRecords({ ...filters, granularity: profitGranularity });
  profitImpactData = periodRecords;
  const records = periodRecords;
  window.refreshProfitImpactView?.(dataDrivenState.selectedProfitItem);
  window.__renderProfitImpactDetail?.(dataDrivenState.selectedProfitItem);
  const grouped = window.CogDataService.groupCostByItem(filters);
  const total = window.CogDataService.getCostSummary(filters);
  const cards = cost.querySelectorAll('.metric-grid .metric');
  const cardData = [{ label: '총 손익 영향', value: total.actualProfitImpact, note: `기준 대비 ${total.variance >= 0 ? '+' : ''}${total.variance.toFixed(1)}백만원` }, ...grouped.map((item) => ({ label: item.costItem, value: item.actualProfitImpact, note: `기준 대비 ${item.variance >= 0 ? '+' : ''}${item.variance.toFixed(1)}백만원` }))];
  cards.forEach((card, index) => { const item = cardData[index]; if (!item) return; card.querySelector('span').textContent = item.label; card.querySelector('b').textContent = `${item.value >= 0 ? '+' : ''}${item.value.toFixed(1)}백만원`; card.querySelector('small').textContent = item.note; });
  cost.querySelectorAll('.usage-grid > div').forEach((element, index) => {
    const item = grouped[index]; if (!item) return;
    const actual = item.actualUsage.toFixed(1); const target = item.targetUsage.toFixed(1); const variance = item.actualUsage - item.targetUsage;
    element.querySelector('b').textContent = item.costItem;
    element.querySelector('span').innerHTML = `실제 <strong>${actual}</strong>`;
    element.querySelector('small').innerHTML = `기준 ${target} · <b class="${variance > 0 ? 'red-text' : 'positive'}">${variance >= 0 ? '+' : ''}${variance.toFixed(1)} 증감</b>`;
    element.querySelector('i em').style.width = `${Math.min(100, Math.max(8, item.actualUsage / item.targetUsage * 85))}%`;
  });
  cost.querySelectorAll('.usage-grid > div').forEach((element, index) => {
    const item = grouped[index]; if (!item) return;
    const actual = item.actualUsage; const target = item.targetUsage; const variance = actual - target;
    element.querySelector('b').textContent = item.usageLabel || item.costItem;
    element.querySelector('span').innerHTML = `실적 <strong>${actual.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${item.usageUnit || ''}</strong>`;
    element.querySelector('small').innerHTML = `목표 ${target.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${item.usageUnit || ''} · <b class="${variance > 0 ? 'red-text' : 'positive'}">${variance >= 0 ? '+' : ''}${variance.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${item.usageUnit || ''} 증감</b>`;
  });
  const monthly = [...new Set(records.map((row) => row.period))].map((period) => ({ period, value: records.filter((row) => row.period === period).reduce((sum, row) => sum + row.actualProfitImpact, 0) }));
  const monthlyNet = cost.querySelector('.monthly-net');
  if (monthlyNet) { const max = Math.max(...monthly.map((item) => Math.abs(item.value)), 1); monthlyNet.innerHTML = monthly.map((item) => `<div class="${item.value >= 0 ? 'positive-month' : ''}"><i style="height:${Math.max(8, Math.abs(item.value) / max * 80)}%"></i><b>${item.value >= 0 ? '+' : ''}${item.value.toFixed(1)}백만원</b><span>${Number(item.period.slice(5))}월</span></div>`).join(''); }
  cost.querySelector('.page-head .filters button:first-child')?.replaceChildren(`▣ ${filters.start.replaceAll('-', '.')} ~ ${filters.end.replaceAll('-', '.')}`);
}
function exportProfitCsv() {
  const records = window.CogDataService.getCostRecords({ start: dataDrivenState.start, end: dataDrivenState.end });
  const rows = ['기간,손익항목,실제손익영향(백만원),기준손익영향(백만원),기준대비차이(백만원)', ...records.map((row) => `${row.period},${row.costItem},${row.actualProfitImpact},${row.baselineProfitImpact},${row.variance}`)];
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\uFEFF${rows.join('\n')}`], { type: 'text/csv' })); link.download = '손익영향_조회결과.csv'; link.click(); URL.revokeObjectURL(link.href);
}
document.querySelectorAll('#cost .impact-composition-card [data-profit-granularity]').forEach((button) => button.addEventListener('click', () => window.__setProfitGranularity?.(button.dataset.profitGranularity)));
document.querySelectorAll('#cost .impact-composition-card [data-profit-granularity]').forEach((button) => button.classList.toggle('selected', button.dataset.profitGranularity === profitGranularity));
function exportProfitExcel() {
  const records = window.CogDataService.getCostRecords({ ...profitImpactFilters, granularity: profitGranularity });
  const rows = [['기간', '원가항목', '실제 손익영향(백만원)', '기준 손익영향(백만원)', '기준 대비 차이(백만원)', '실제 사용량', '기준 사용량'], ...records.map((row) => [row.period, row.costItem, row.actualProfitImpact, row.baselineProfitImpact, row.variance, row.actualUsage, row.targetUsage])];
  const table = '<table><thead><tr>' + rows[0].map((cell) => '<th>' + cell + '</th>').join('') + '</tr></thead><tbody>' + rows.slice(1).map((row) => '<tr>' + row.map((cell) => '<td>' + cell + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['<html><head><meta charset="UTF-8"></head><body>' + table + '</body></html>'], { type: 'application/vnd.ms-excel' })); link.download = '손익영향_항목별_조회결과.xls'; link.click(); URL.revokeObjectURL(link.href);
}
renderDiagnosisFromEvent();

function wireOverviewHeaderControls() {
  const buttons = document.querySelectorAll('#overview .page-head .filters button');
  const filter = document.querySelector('#overview .overview-period-filter');
  buttons[1]?.addEventListener('click', () => filter?.querySelector('input')?.focus());
  buttons[2]?.addEventListener('click', () => refreshDataDrivenViews({}));
}
wireOverviewHeaderControls();
document.querySelector('#cost .page-head .filters button:last-child')?.addEventListener('click', () => {
  selectDiagnosisEvent();
  const event = window.CogMockData.events.find((item) => item.id === dataDrivenState.selectedEventId);
  renderCostFromData({ start: event.startAt, end: event.endAt });
});
document.querySelector('#cost .profit-impact-detail .pill')?.remove();
document.querySelector('#cost .impact-composition-card [data-profit-export]')?.addEventListener('click', exportProfitExcel);
document.querySelector('#brief .page-head .filters')?.remove();

async function saveManagementStandard(form) {
  const metricLabel = form.querySelector('select')?.value;
  const definition = window.CogMockData.metricDefinitions.find((item) => item.label === metricLabel);
  const effectiveFrom = form.querySelector('input')?.value?.slice(0, 10).replaceAll('.', '-') || dataDrivenState.end;
  const current = window.CogDataService.getActiveStandard(definition.id, effectiveFrom);
  const nextStandard = { ...current, metricId: definition.id, effectiveFrom };
  try {
    const response = await fetch(`/api/standards/${encodeURIComponent(definition.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextStandard) });
    if (!response.ok) throw new Error('standard save failed');
    const standards = await fetch('/api/standards').then((item) => item.json());
    window.CogMockData.standards = standards;
  } catch (_) {
    window.CogMockData.standards.push(nextStandard);
  }
  renderStandardsFromData(); refreshDataDrivenViews({});
}
document.querySelector('#standard-modal form')?.addEventListener('submit', async (event) => { event.preventDefault(); await saveManagementStandard(event.currentTarget); document.querySelector('#standard-modal').close(); });
async function syncManagementStandardsFromServer() {
  try {
    const response = await fetch('/api/standards');
    if (!response.ok) return;
    window.CogMockData.standards = await response.json();
    renderStandardsFromData(); refreshDataDrivenViews({});
  } catch (_) {
    // 기존 정적 화면으로 열었을 때는 현재 기준 데이터를 그대로 사용한다.
  }
}
syncManagementStandardsFromServer();
async function syncOperatingDataFromServer() {
  try {
    const response = await fetch('/api/observations');
    if (!response.ok) return;
    const observations = await response.json();
    if (!observations.length) return;
    window.CogMockData.dailyObservations = observations;
    refreshDataDrivenViews({});
  } catch (_) {
    // 기존 정적 화면으로 열었을 때는 현재 운영 데이터를 그대로 사용한다.
  }
}
syncOperatingDataFromServer();
setInterval(() => {
  syncManagementStandardsFromServer();
  syncOperatingDataFromServer();
}, 30000);
document.querySelectorAll('.synthetic').forEach((element) => element.remove());
