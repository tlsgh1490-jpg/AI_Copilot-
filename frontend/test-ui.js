const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('frontend/index.html', 'utf8');
const app = fs.readFileSync('frontend/app.js', 'utf8');
const dataService = fs.existsSync('frontend/data-service.js') ? fs.readFileSync('frontend/data-service.js', 'utf8') : '';
assert.ok(fs.existsSync('frontend/data.js'), 'Shared mock operating-data module must exist');
assert.ok(html.includes('src="workbook-source.js"') && html.includes('src="data.js"'), 'Workbook-derived source data and the shared model must load before the UI app');
assert.ok(dataService.includes('CogDataService'), 'Shared data service must expose a stable query API');
assert.ok(dataService.includes('getKpiSummaries'), 'Shared data service must calculate KPI summaries');
assert.ok(dataService.includes('getCostRecords'), 'Shared data service must query cost records');
assert.ok(dataService.includes('costObservations') && dataService.includes('normalizeTimestamp'), 'Shared data service must calculate profit impacts from raw hourly observations');
assert.ok(app.includes('refreshDataDrivenViews'), 'UI must have one data-driven refresh entry point');
assert.ok(app.includes('CogDataService.getKpiSummaries'), 'UI KPI cards must consume shared data service results');
assert.ok(app.includes('CogDataService.getCostRecords'), 'UI profit-impact charts must consume shared data service results');
assert.ok(app.includes('processOverviewBridge'), 'Process overview must render from shared operating observations');
assert.ok(app.includes('CogDataService.getObservations'), 'Process table must consume shared daily observations');
assert.ok(app.includes('overview-period-filter'), 'Operations overview needs a working period filter');
assert.ok(app.includes('applyProcessQuickRange'), 'Process comparison quick ranges must update date inputs');
assert.ok(app.includes('refreshProfitImpactView'), 'Profit-impact period filters must re-render every related visual');
assert.ok(app.includes('renderStandardsFromData'), 'Standards screen must render effective-dated shared standards');
assert.ok(app.includes('renderCopilotTopic'), 'Copilot topic choices must update their supporting data');
assert.ok(!app.includes('makeProfitRows'), 'Component-local profit mock rows must be removed');
assert.ok(app.includes('renderProcessStandardAnalysis'), 'Process standard analysis must consume shared service results');
assert.ok(app.includes('processAnalysisState'), 'Process analysis needs shared selected-metric state');
assert.ok(app.includes('syncProcessMetricChips'), 'Process metric chips must drive comparison results');
assert.ok(app.includes('const metricDefs = window.CogMockData.metricDefinitions;'), 'Process overview must expose every shared KPI and process variable');
assert.ok(app.includes('selectDiagnosisEvent'), 'Diagnosis event control must change shared event state');
assert.ok(app.includes('exportProfitCsv'), 'Profit-impact CSV button must be connected');
assert.ok(app.includes('saveManagementStandard'), 'Management-standard save must update mock data');
assert.ok(app.includes('wireOverviewHeaderControls'), 'Overview header controls must be connected');
assert.ok(app.includes('renderDiagnosisFromEvent'), 'Diagnosis must render event-specific data');
assert.ok(app.includes('renderCostFromData'), 'Cost screen must render summaries from shared records');
assert.ok(!app.includes("getCostSummary({ ...filters, start: '2025-01-01', end: '2025-12-31' })"), 'Overview profit summary must not ignore the selected date range');
assert.ok(app.includes('renderProfitBreakdown'), 'Overview profit detail rows must refresh with the selected date range');
const requiredText = [
  '\u004b\u0050\u0049 \ud604\ud669',
  '\uc815\uc81c\ub7c9',
  '1,058k',
  '\uad00\ub828 \uc9c0\ud45c \ud604\ud669',
  '\uc2a4\ud300 M01~M04 \ud3c9\uade0',
  '\uc124\ube44 \ucc28\uc555',
  '\uc810\uc120: \uad00\ub9ac \uae30\uc900 \u00b7 \uc74c\uc601: \uc815\uc0c1 \ubc94\uc704',
  'EX07-2',
  'EX06',
];

requiredText.forEach((label) => assert.ok(html.includes(label), `Missing UI detail: ${label}`));
assert.ok(html.includes('class="metric-kpis"'), 'Overview cards need compact KPI details');
assert.ok(html.includes('class="table-trend'), 'KPI tables need readable mini trend charts');
assert.ok(html.includes('class="related-metrics"'), 'Copilot and diagnosis need grouped related metric charts');
assert.ok(app.includes('breach-summary'), 'Diagnosis needs an explicit breached-KPI summary');
assert.ok(app.includes('comparison-trend'), 'Process results need per-metric comparison charts');
assert.ok(app.includes('process-overview'), 'Integrated process overview needs its own screen');
assert.ok(app.includes('process-kpi-grid'), 'Integrated process overview needs all-metric KPI cards');
assert.ok(app.includes('data-process-filter'), 'Integrated process overview needs selectable KPI filtering');
assert.ok(app.includes('process-data-table'), 'Process overview needs date-sorted actual-data table');
assert.ok(app.includes('trend-numbers'), 'Comparison charts need displayed baseline and comparison values');
assert.ok(app.includes('impact-period-filter'), 'Diagnosis and profit-impact views need period filters');
assert.ok(app.includes('labels.cost'), 'Cost-impact terminology must be renamed to profit impact');
assert.ok(app.includes('profitImpactData'), 'Profit-impact detail must render from structured data');
assert.ok(app.includes('profit-impact-table'), 'Profit-impact detail needs a 12-month table');
assert.ok(app.includes('profit-detail-chart'), 'Profit-impact detail needs a selected-item chart');
assert.ok(app.includes('period-summary'), 'Profit impact needs selected-period cumulative and baseline summary');
assert.ok(app.includes('impact-composition-chart'), 'Waterfall must be replaced with an item-impact bar chart');
assert.ok(app.includes('process-table-units'), 'Process actual-data table needs units alongside pivoted metric columns');
assert.ok(app.includes('managementStandardData'), 'Process analysis needs data-driven management-standard comparison');
assert.ok(app.includes('standard-comparison-result'), 'Process analysis needs a selected-period standard comparison result');
assert.ok(app.includes('normal-kpi-summary'), 'Operations overview needs all normal KPI details');
assert.ok(app.includes('formatCostUnitText'), 'Profit-impact amounts must use Korean million-won units');
assert.ok(app.includes('kpi-card-detail'), 'All KPI status cards need non-overlapping detail layouts');
assert.ok(app.includes('standardUsageAnalysisData'), 'Standard comparison needs usage and savings deltas');
assert.ok(app.includes('profit-item-charts'), 'Profit impact needs a separate monthly chart per cost item');
assert.ok(app.includes('analysis-mode-tabs'), 'Period comparison and standard comparison need a shared analysis mode control');
assert.ok(!app.includes("analysisTabs.querySelector('[data-analysis-mode=\"standard\"]')?.remove()"), 'Process analysis must keep the management-standard comparison tab visible');
assert.ok(app.includes('kpi-status-summary-grid'), 'KPI summaries must use a dense status-group layout');
assert.ok(app.includes('profit-item-chart'), 'Profit impact must retain separate readable item charts');
assert.ok(app.includes('period-profit-summary'), 'Operations overview needs a compact non-empty profit summary');
assert.ok(app.includes('kpi-alert-note'), 'Warning and abnormal KPI panels need supporting detail');
assert.ok(app.includes('profit-table-with-composition'), 'Profit composition must sit beside the monthly table');
assert.ok(app.includes('profit-chart-summary'), 'Each profit item chart needs a title-side summary');
assert.ok(app.includes('kpi-detail-toggle'), 'KPI overview needs a progressive detail toggle');
assert.ok(app.includes('profit-value') && app.includes('profit-baseline-label'), 'Profit charts need visible bar and baseline values without a dense number grid');
assert.ok(app.includes('brief-kpi-detail-toggle'), 'Brief needs the same progressive KPI detail control');
assert.ok(app.includes('brief-profit-summary'), 'Brief needs the profit-impact summary before KPI details');
assert.ok(app.includes('brief-kpi-satisfaction'), 'Brief needs a KPI satisfaction summary');
assert.ok(app.includes("value.toFixed(1)") && app.includes("\\ubc31\\ub9cc\\uc6d0"), 'Profit impact must use million-won units consistently');
assert.ok(app.includes('refreshDataDrivenViews'), 'Filter changes must refresh approved screen data together');
assert.ok(html.includes('data-view="processOverview"'), 'Process overview must be an operations-overview subtab');
assert.ok(html.includes('\ud654\uc131\uacf5\uc7a5 \uc6b4\uc601\ud604\ud669'), 'Overview navigation needs the approved name');
assert.ok(html.includes('type="datetime-local"'), 'Process comparison needs calendar-ready datetime inputs');
console.log('UI detail regression checks passed');
