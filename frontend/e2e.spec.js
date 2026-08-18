const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const appUrl = pathToFileURL(path.resolve(__dirname, 'index.html')).href;

test.use({ channel: 'chrome' });

test('standard change modal cancels without saving and applies the entered limit on save', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="standards"]').click();
  const modal = page.locator('#standard-modal');
  const historyRows = page.locator('#standards .standards-grid .card').nth(1).locator('tbody tr');
  const historyCount = await historyRows.count();

  await page.locator('#standard-modal-button').click();
  await modal.getByRole('button', { name: '취소' }).click();
  await expect(modal).not.toBeVisible();
  await expect(historyRows).toHaveCount(historyCount);

  await page.locator('#standard-modal-button').click();
  await modal.locator('select[name="metricId"]').selectOption('qualityContent');
  await modal.locator('input[name="normalMax"]').fill('0.700');
  await modal.locator('input[name="reason"]').fill('발표용 기준 확인');
  await modal.getByRole('button', { name: '변경 저장' }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#standards .standards-grid .card').first()).toContainText('상한 0.7');
  await expect(historyRows).toHaveCount(historyCount + 1);
  await expect(page.locator('#standards .standards-grid .card').nth(1)).toContainText('발표용 기준 확인');
});

test('selected overview date range refreshes profit summary and breakdown', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const before = await page.locator('#overview .period-profit-summary > div > b').innerText();
  const trendBefore = await page.locator('#overview .spark').first().getAttribute('data-trend-periods');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-30');
  await filter.getByRole('button', { name: '조회' }).click();
  await expect(page.locator('#overview .period-profit-summary > div > b')).not.toHaveText(before);
  await expect(page.locator('#overview .spark').first()).not.toHaveAttribute('data-trend-periods', trendBefore || '');
  expect((await page.locator('#overview .spark').first().getAttribute('data-trend-periods')).split(',').length).toBeGreaterThanOrEqual(5);
  await expect(page.locator('#overview .profit-breakdown span').first()).toContainText('백만원');
});

test('positive profit amounts use the positive color and negative amounts use red', async ({ page }) => {
  await page.goto(appUrl);
  const total = page.locator('#overview .period-profit-summary > div > b');
  await expect(total).toHaveClass(/positive/);
  await expect(page.locator('#overview .cost-list strong').first()).toHaveClass(/positive/);
});

test('Brief profit breakdown uses the selected period cost calculation', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-11');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-16');
  await filter.getByRole('button', { name: '조회' }).click();
  await page.locator('[data-view="brief"]').first().click();
  await expect(page.locator('#brief .brief-profit-summary')).toContainText('+56.8백만원');
  await expect(page.locator('#brief .brief-profit-summary')).toContainText('+41.1백만원');
  await expect(page.locator('#brief .brief-profit-summary')).not.toContainText('-10.2백만원');
});

test('Brief distinguishes a normal period average from in-period management breaches', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-30');
  await filter.getByRole('button', { name: '조회' }).click();
  await page.locator('[data-view="brief"]').first().click();
  const alert = page.locator('#brief .brief-full .alert');
  await expect(alert).toContainText('기간 평균은 정상 범위');
  await expect(alert).toContainText('스팀 사용량');
  await expect(alert).toContainText('이상');
  await expect(alert).toContainText('09.10 ~ 09.17');
});

test('overview summary distinguishes a normal average from in-period management breaches', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-30');
  await filter.getByRole('button', { name: '조회' }).click();
  const insight = page.locator('#overview .insight-list');
  await expect(insight).toContainText('기간 내 일시 이탈');
  await expect(insight).toContainText('스팀 사용량');
  await expect(insight).toContainText('09.10 ~ 09.17');
});

test('overview starts on the latest available source date', async ({ page }) => {
  await page.goto(appUrl);
  const inputs = page.locator('#overview .overview-period-filter input');
  await expect(inputs.nth(0)).toHaveValue('2025-12-31');
  await expect(inputs.nth(1)).toHaveValue('2025-12-31');
});

test('period filters default to operational-day inputs and expose optional time mode', async ({ page }) => {
  await page.goto(appUrl);
  const filters = [
    page.locator('#overview .overview-period-filter'),
    page.locator('#cost .impact-period-filter'),
    page.locator('#diagnosis .impact-period-filter'),
    page.locator('#processOverview .process-overview-filter'),
  ];
  for (const filter of filters) {
    await expect(filter.locator('[data-period-input]').first()).toHaveAttribute('type', 'date');
    await expect(filter.locator('[data-time-mode]')).not.toBeChecked();
    await filter.locator('[data-time-mode]').evaluate((element) => { element.checked = true; element.dispatchEvent(new Event('change', { bubbles: true })); });
    await expect(filter.locator('[data-period-input]').first()).toHaveAttribute('type', 'datetime-local');
  }
});

test('process comparison does not show an unused hourly-mode checkbox', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  await expect(page.locator('#process [data-time-mode]')).toHaveCount(0);
});

test('steam units are consistently displayed as t/h', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.locator('#overview .spark-grid .spark').filter({ hasText: '스팀 사용량 (t/h)' })).toHaveCount(1);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  await expect(page.locator('#cost .usage-grid')).toContainText('t/h');
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  await expect(page.locator('#processOverview .process-kpi-grid')).toContainText('스팀 사용량 (t/h)');
});

test('Brief does not show unused print or report export actions', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  await expect(page.locator('#brief .page-head .filters')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /인쇄|보고서 내보내기/ })).toHaveCount(0);
});

test('Brief shows dynamic warning and abnormal KPI summaries without the snapshot card', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  await expect(page.locator('#brief .brief-kpi-snapshot')).toHaveCount(0);
  const alertSummary = page.locator('#brief .brief-alert-kpis');
  await expect(alertSummary).toContainText('주의 KPI');
  await expect(alertSummary).toContainText('기준 대비');
  await expect(alertSummary.locator('.brief-alert-group.danger')).toContainText('이상 KPI');
});

test('topbar does not show the fixed data 기준 timestamp badge', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.locator('.topbar .top-meta')).toHaveCount(0);
});

test('overview quick ranges refresh KPI trends and profit data', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const profit = page.locator('#overview .period-profit-summary > div > b');
  const spark = page.locator('#overview .spark').first();
  await filter.locator('button[data-overview-range="1"]').click();
  const oneDayProfit = await profit.innerText();
  const oneDayPeriods = await spark.getAttribute('data-trend-periods');
  await expect(filter.locator('[data-period-input]').nth(0)).toHaveValue('2025-12-30');
  await filter.locator('button[data-overview-range="30"]').click();
  await expect(profit).not.toHaveText(oneDayProfit);
  await expect(spark).not.toHaveAttribute('data-trend-periods', oneDayPeriods || '');
  await expect(page.locator('#overview .kpi-status-board tbody tr')).not.toHaveCount(0);
});

test('KPI status values change when the selected range changes within one month', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('#overview .kpi-detail-toggle').click();
  const filter = page.locator('#overview .overview-period-filter');
  const purified = page.locator('#overview .kpi-status-board tbody tr').filter({ hasText: '정제량' }).locator('td').nth(2).locator('b');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-12');
  await filter.locator('button.primary').click();
  const first = await purified.innerText();
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-05');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-12');
  await filter.locator('button.primary').click();
  await expect(purified).not.toHaveText(first);
});

test('quality content card displays the selected-period average with sufficient precision', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const card = page.locator('#overview .spark-grid .spark').first().locator(':scope > b');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-12');
  await filter.locator('button.primary').click();
  const first = await card.innerText();
  const firstAverage = await page.evaluate(() => window.CogDataService.getKpiSummaries({ start: '2025-12-01', end: '2025-12-12', granularity: 'day' }).find((row) => row.id === 'qualityContent')?.value);
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-05');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-12');
  await filter.locator('button.primary').click();
  const second = await card.innerText();
  const secondAverage = await page.evaluate(() => window.CogDataService.getKpiSummaries({ start: '2025-12-05', end: '2025-12-12', granularity: 'day' }).find((row) => row.id === 'qualityContent')?.value);
  expect(firstAverage).not.toBe(secondAverage);
  expect(first).toMatch(/0\.7/);
});

test('overview period changes are carried into lower screens', async ({ page }) => {
  await page.goto(appUrl);
  const overviewFilter = page.locator('#overview .overview-period-filter');
  await overviewFilter.locator('button[data-overview-range="7"]').click();
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  await expect(page.locator('#cost .impact-period-filter [data-period-input]').nth(0)).toHaveValue('2025-12-24');
  await expect(page.locator('#cost .impact-period-filter [data-period-input]').nth(1)).toHaveValue('2025-12-31');
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  await expect(page.locator('#diagnosis .impact-period-filter [data-period-input]').nth(0)).toHaveValue('2025-12-24');
  await expect(page.locator('#diagnosis .impact-period-filter [data-period-input]').nth(1)).toHaveValue('2025-12-31');
});

test('diagnosis identifies the in-range event only when its KPI is actually abnormal', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  const filter = page.locator('#diagnosis .impact-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-08-18');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-12');
  await filter.locator('button.primary').click();
  const title = page.locator('#diagnosis .hero h2');
  await expect(title).toContainText('EVENT_');
});

test('event diagnosis analyzes only the selected event period inside a wider query', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  await page.evaluate(() => window.renderDiagnosisFromEvent?.('EVENT_2025_02', { start: '2025-09-01', end: '2025-09-30' }));
  await expect(page.locator('#diagnosis .page-head p')).toContainText('이벤트 분석 기간 2025.09.10');
  const actual = await page.locator('#diagnosis .trend-summary span').nth(2).locator('b').innerText();
  const expected = await page.evaluate(() => window.CogDataService.getKpiSummaries({ start: '2025-09-10', end: '2025-09-19' }).find((item) => item.id === 'steamUsage')?.value.toFixed(1));
  expect(actual).toContain(expected);
});

test('diagnosis trend labels use the same period as the selected diagnosis query', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  await page.evaluate(() => window.renderDiagnosisFromEvent?.(null, { start: '2025-01-01', end: '2025-02-28' }));
  const labels = await page.locator('#diagnosis .x-axis span').allTextContents();
  expect(labels[0]).toBe('01.01');
  expect(labels.at(-1)).toBe('02.28');
});

test('cost period filter refreshes monthly table to selected month', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const filter = page.locator('#cost .impact-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-10-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-10-31');
  await filter.getByRole('button', { name: '조회' }).click();
  await expect(page.locator('#cost .period-summary')).toContainText('백만원');
});

test('cost usage cards keep gas, material, and steam usage separate', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const cards = page.locator('#cost .usage-grid > div');
  await expect(cards).toHaveCount(3);
  if (false) {
  await expect(cards.nth(0)).toContainText('가스 사용량');
  await expect(cards.nth(1)).toContainText('약품 A+B 사용량');
  await expect(cards.nth(2)).toContainText('스팀 사용량');
  }
  await expect(cards.nth(0)).toContainText('Nm3');
  await expect(cards.nth(1)).toContainText('kg');
  await expect(cards.nth(1)).toContainText('약품 전체');
  await expect(cards.nth(2)).toContainText('t');
  expect(await cards.nth(0).locator('strong').innerText()).not.toBe(await cards.nth(1).locator('strong').innerText());
});

test('event profit impacts explicitly show positive and negative signs', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  await page.evaluate(() => window.renderCostEventTable?.({ start: '2025-09-10T07:00:00', end: '2025-09-19T07:00:00' }));
  const eventRow = page.locator('#cost table.simple-table').filter({ hasText: 'EVENT_2025_02' }).locator('tbody tr').first();
  await expect(eventRow).toContainText('+');
  await expect(eventRow).toContainText('스팀 사용량');
  await expect(eventRow).toContainText('09.10 ~ 09.17');
});

test('chemical cost detail supports total, A, and B filters for the selected period', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const tabs = page.locator('#cost .profit-item-tabs [data-profit-item]');
  await expect(tabs).toContainText(['약품 전체', '약품 A', '약품 B']);
  await tabs.filter({ hasText: '약품 A' }).click();
  await expect(page.locator('#cost .profit-item-charts .profit-item-chart')).toHaveCount(1);
  await expect(page.locator('#cost .profit-item-charts .profit-item-chart h4')).toHaveText('약품 A');
  const before = await page.locator('#cost .period-summary b').first().innerText();
  const filter = page.locator('#cost .impact-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-30');
  await filter.locator('button.primary').click();
  await expect(page.locator('#cost .profit-item-charts .profit-item-chart h4')).toHaveText('약품 A');
  await expect(page.locator('#cost .period-summary b').first()).not.toHaveText(before);
});

test('overview and brief KPI detail toggles reveal additional shared KPI rows', async ({ page }) => {
  await page.goto(appUrl);
  const overviewRows = page.locator('#overview .kpi-status-board tbody tr');
  const beforeOverview = await overviewRows.count();
  await page.locator('#overview .kpi-detail-toggle').click();
  await expect(overviewRows).toHaveCount(25);
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  const briefRows = page.locator('#brief table.simple-table tbody tr');
  const beforeBrief = await briefRows.count();
  await page.locator('#brief .brief-kpi-detail-toggle').click();
  expect(beforeOverview).toBe(3);
  expect(beforeBrief).toBe(3);
  await expect(briefRows).toHaveCount(25);
});

test('profit charts show bar values, period labels, and refresh cumulative value', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const chart = page.locator('#cost .profit-item-chart').first();
  const before = await chart.locator('.profit-chart-summary b').innerText();
  const selectedStart = await page.locator('#cost .impact-period-filter input').nth(0).inputValue();
  await expect(chart.locator('.profit-chart-numbers')).toHaveCount(0);
  await expect(chart.locator('.profit-baseline')).toHaveCount(0);
  await expect(chart.locator('.profit-baseline-label')).toHaveCount(0);
  await expect(chart.locator('svg .profit-month').first()).toHaveText(selectedStart.slice(5).replace('-', '/'));
  await page.locator('#cost .impact-period-filter [data-period-input]').nth(0).fill('2025-10-01');
  await page.locator('#cost .impact-period-filter [data-period-input]').nth(1).fill('2025-10-31');
  await page.locator('#cost .impact-period-filter button.primary').click();
  await expect(chart.locator('.profit-chart-summary b')).not.toHaveText(before);
});

test('daily profit periods produce different prorated results', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const total = page.locator('#overview .period-profit-summary > div > b');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-02');
  await filter.locator('button.primary').click();
  const twoDays = await total.innerText();
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-08');
  await filter.locator('button.primary').click();
  await expect(total).not.toHaveText(twoDays);
});

test('operations and brief links open process overview with the selected range', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-08');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-10');
  await filter.locator('button.primary').click();
  await page.locator('#overview [data-view="process"]').click();
  await expect(page.locator('#processOverview')).toHaveClass(/active/);
  await expect(page.locator('#processOverview [data-period-input]').first()).toHaveValue('2025-12-08');
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  await page.locator('#brief [data-view="process"]').click();
  await expect(page.locator('#processOverview')).toHaveClass(/active/);
});

test('process overview exposes all KPI and process-variable selectors', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  await expect(page.locator('#processOverview .metric-checks input')).toHaveCount(25);
  await expect(page.locator('#processOverview .metric-checks')).toContainText('총괄열전달계수');
  await expect(page.locator('#processOverview .metric-checks')).toContainText('농도');
  await expect(page.locator('#processOverview .process-kpi-grid article')).toHaveCount(6);
  const showAll = page.locator('#processOverview [data-select-all]');
  await expect(showAll).toHaveText('전체 지표 보기');
  await showAll.click();
  await expect(page.locator('#processOverview .process-kpi-grid article')).toHaveCount(25);
  await expect(showAll).toHaveText('주요 KPI 보기');
});

test('process overview checkboxes always match the KPI columns currently displayed', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  const checks = view.locator('.metric-checks input');
  await expect(checks).toHaveCount(25);
  expect(await checks.evaluateAll((items) => items.filter((item) => item.checked).length)).toBe(6);
  await checks.nth(0).evaluate((input) => {
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(view.locator('.process-kpi-grid article')).toHaveCount(5);
  expect(await checks.evaluateAll((items) => items.filter((item) => item.checked).length)).toBe(5);
});

test('process overview query selects and displays only the in-period issue metrics', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  const inputs = view.locator('[data-period-input]');
  await inputs.nth(0).fill('2025-09-01');
  await inputs.nth(1).fill('2025-09-30');
  await view.locator('[data-process-query]').click();
  const checks = view.locator('.metric-checks input');
  expect(await checks.evaluateAll((items) => items.filter((item) => item.checked).length)).toBe(2);
  await expect(view.locator('.process-kpi-grid article')).toHaveCount(2);
  await expect(view.locator('.process-data-table thead')).toContainText('스팀 사용량');
  await expect(view.locator('.process-data-table thead')).toContainText('품질함량');
});

test('process overview keeps a user-selected metric set after querying a new period', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  const checks = view.locator('.metric-checks input');
  await checks.nth(0).evaluate((input) => {
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const selectedBefore = await checks.evaluateAll((items) => items.filter((item) => item.checked).map((item) => item.value));
  await view.locator('[data-process-query]').click();
  const selectedAfter = await checks.evaluateAll((items) => items.filter((item) => item.checked).map((item) => item.value));
  expect(selectedAfter).toEqual(selectedBefore);
});

test('process-variable selector includes total steam usage', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const selects = page.locator('#process .select-row select');
  await selects.nth(0).selectOption({ label: '공정 변수' });
  await expect(selects.nth(1)).toContainText('스팀 사용량');
});

test('process comparison replaces unrelated defaults with the detected issue and its related process variables', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const view = page.locator('#process');
  const inputs = view.locator('[data-period-input]');
  await inputs.nth(0).fill('2025-09-10');
  await inputs.nth(1).fill('2025-09-19');
  await view.locator('.primary.full').click();
  const chips = view.locator('.chips');
  await expect(chips).toContainText('스팀 사용량');
  await expect(chips).toContainText('스팀 M01');
  await expect(chips).not.toContainText('정제량');
  await expect(view.locator('.result tbody')).toContainText('스팀 M01');
  await expect(view.locator('.analysis-note')).toContainText('분석 기준');
});

test('process comparison explains the suspected cause with related-variable evidence', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const view = page.locator('#process');
  const inputs = view.locator('[data-period-input]');
  await inputs.nth(0).fill('2025-09-10');
  await inputs.nth(1).fill('2025-09-19');
  await view.locator('.primary.full').click();
  const note = view.locator('.analysis-note');
  await expect(note.locator('.analysis-cause')).toContainText('추정 원인');
  await expect(note.locator('.analysis-evidence')).toContainText('스팀 M01');
  await expect(note.locator('.analysis-priority')).toContainText('점검 우선순위');
  await expect(note.locator('.analysis-basis')).toContainText('분석 기준');
});

test('overview period filters keep the hourly control attached below the date inputs', async ({ page }) => {
  await page.goto(appUrl);
  for (const selector of ['#overview .overview-period-filter', '#processOverview .process-overview-filter']) {
    const filter = page.locator(selector);
    await expect(filter.locator('.time-mode-control')).toHaveCount(1);
    await expect(filter.locator('.time-mode-control')).toContainText('시간 단위 조회');
  }
});

test('production and chemical unit metrics retain their supplied calculation bases', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  await page.locator('#processOverview [data-select-all]').click();
  const table = page.locator('#processOverview .process-data-table');
  await expect(table.locator('thead')).toContainText('kg/원료(ton)');
  await expect(page.locator('#processOverview .process-kpi-grid')).toContainText('kg/천Nm³');
  await expect(page.locator('#processOverview .process-kpi-grid')).toContainText('g/Nm³');
});

test('production unit source values are expressed as kilograms per raw-material ton', async ({ page }) => {
  await page.goto(appUrl);
  const values = await page.evaluate(() => window.CogMockData.dailyObservations.flatMap((row) => [row.metrics.aUnit, row.metrics.bUnit, row.metrics.cUnit]));
  expect(Math.max(...values)).toBeLessThan(20);
});

test('process overview exposes steam M01 through M06 with shared management criteria', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  await expect(view.locator('.metric-checks')).toContainText('스팀 M05');
  await expect(view.locator('.metric-checks')).toContainText('스팀 M06');
  await expect(view.locator('.process-kpi-grid')).toContainText('스팀 M05');
  await expect(view.locator('.process-kpi-grid')).toContainText('스팀 M06');
  await expect(view.locator('.process-kpi-grid')).toContainText('정상');
  const steam = await page.evaluate(() => {
    const row = window.CogMockData.dailyObservations.find((item) => item.period === '2025-12-31');
    return { total: row.metrics.steamUsage, m05: row.metrics.steamM05, m06: row.metrics.steamM06 };
  });
  expect(steam.total).toBeCloseTo(15.31433, 3);
  expect(steam.m05).toBeCloseTo(2.553485, 4);
  expect(steam.m06).toBeCloseTo(2.52927, 5);
});

test('process overview exports the selected actual-data table to Excel', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const download = page.waitForEvent('download');
  await page.locator('#processOverview [data-process-export]').click();
  expect((await download).suggestedFilename()).toMatch(/공정현황_조회결과\.xls$/);
});

test('process overview Excel export retains raw decimal precision', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  const inputs = view.locator('input[data-period-input]');
  await inputs.nth(0).fill('2025-12-31');
  await inputs.nth(1).fill('2025-12-31');
  await view.locator('[data-process-query]').click();
  const downloadPromise = page.waitForEvent('download');
  await view.locator('[data-process-export]').click();
  const download = await downloadPromise;
  const html = fs.readFileSync(await download.path(), 'utf8');
  expect(html).toContain('15.314326');
});

test('profit item charts expose daily/monthly controls and export from the item section', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  await expect(page.locator('#cost .impact-composition-card [data-profit-granularity]')).toHaveCount(2);
  await expect(page.locator('#cost .impact-composition-card [data-profit-export]')).toHaveCount(1);
  await expect(page.locator('#cost .profit-impact-detail [data-profit-export]')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.locator('#cost .impact-composition-card [data-profit-export]').click();
  expect((await download).suggestedFilename()).toMatch(/손익영향_항목별_조회결과\.xls$/);
  await page.locator('#cost .impact-period-filter [data-period-input]').nth(0).fill('2025-12-01');
  await page.locator('#cost .impact-period-filter [data-period-input]').nth(1).fill('2025-12-03');
  await page.locator('#cost .impact-period-filter button.primary').click();
  await expect(page.locator('#cost .impact-composition-card [data-profit-granularity="day"]')).toHaveClass(/selected/);
  await page.locator('#cost .impact-composition-card [data-profit-granularity="month"]').click();
  await expect(page.locator('#cost .profit-item-chart').first().locator('.profit-period-label').last()).toHaveText('25.12');
});

test('profit detail follows the selected daily view and exports an Excel file', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const filter = page.locator('#cost .impact-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-30');
  await filter.getByRole('button', { name: '조회' }).click();
  await page.locator('#cost [data-profit-granularity="day"]').click();
  await expect(page.locator('#cost .profit-impact-detail h2')).toHaveText('일별 손익영향');
  await expect(page.locator('#cost .profit-impact-detail .profit-impact-table th').nth(1)).toContainText('/');
  const download = page.waitForEvent('download');
  await page.locator('#cost .profit-impact-detail [data-profit-export]').click();
  expect((await download).suggestedFilename()).toMatch(/손익영향_항목별_조회결과\.xls$/);
});

test('daily profit chart uses short non-overlapping date labels in a horizontally scrollable chart', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const filter = page.locator('#cost .impact-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-30');
  await filter.getByRole('button', { name: '조회' }).click();
  await page.locator('#cost [data-profit-granularity="day"]').click();
  const chart = page.locator('#cost .profit-item-chart').first();
  const labels = chart.locator('svg .profit-month');
  await expect(labels.first()).toHaveText(/\d{2}\/\d{2}/);
  const positions = await labels.evaluateAll((items) => items.slice(0, 2).map((item) => Number(item.getAttribute('x'))));
  expect(positions[1] - positions[0]).toBeGreaterThanOrEqual(64);
  expect(await chart.evaluate((element) => element.scrollWidth > element.clientWidth)).toBeTruthy();
});

test('overview spark cards match the selected period KPI summaries', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-20');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-26');
  await filter.locator('button.primary').click();
  const cards = page.locator('#overview .spark-grid .spark');
  const values = [];
  for (let i = 0; i < await cards.count(); i += 1) values.push(await cards.nth(i).locator(':scope > b').innerText());
  const expected = await page.evaluate(() => Object.fromEntries(window.CogDataService.getKpiSummaries({ start: '2025-12-20', end: '2025-12-26', granularity: 'day' }).map((item) => [item.id, { value: item.value, decimals: item.decimals }])));
  const cardIds = ['qualityContent', 'steamUsage', 'purifiedVolume', 'gasOutletTemp'];
  expect(values.map((text, index) => text.replace(/,/g, '').split(' ')[0])).toEqual(cardIds.map((id) => expected[id].value.toFixed(expected[id].decimals)));
  const firstPeriod = [...values];
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-27');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-31');
  await filter.locator('button.primary').click();
  const secondPeriod = [];
  for (let i = 0; i < await cards.count(); i += 1) secondPeriod.push(await cards.nth(i).locator(':scope > b').innerText());
  expect(secondPeriod).not.toEqual(firstPeriod);
});

test('process analysis adds any selected process variable and uses it in results', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const selects = page.locator('#process .select-row select');
  await selects.first().selectOption({ label: '공정 변수' });
  await expect(selects.nth(1).locator('option')).toHaveCount(17);
  await selects.nth(1).selectOption('heatTransfer');
  await expect(selects.nth(1)).toHaveValue('heatTransfer');
  await page.locator('#process [data-add-process-metric]').click();
  await expect(page.locator('#process .chips')).toContainText('총괄열전달계수');
  await expect(page.locator('#process .result tbody')).toContainText('총괄열전달계수');
  await page.locator('#process [data-process-metric="heatTransfer"] button').click();
  await expect(page.locator('#process .result tbody')).not.toContainText('총괄열전달계수');
  await selects.first().selectOption({ label: '품질 · 효율성 지표' });
  await expect(selects.nth(1).locator('option')).toHaveCount(8);
  await selects.nth(1).selectOption('chemicalB');
  await page.locator('#process [data-add-process-metric]').click();
  await expect(page.locator('#process .result tbody')).toContainText('약품 B 원단위');
  await expect(page.locator('#process .result .card-title button.primary')).toHaveCount(0);
  await expect(page.locator('#process .result tbody .recent-trend')).toHaveCount(12);
});

test('process comparison shows inline recent trends without an expanded comparison chart', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  await expect(page.locator('#process .result .card-title button.primary')).toHaveCount(0);
  await expect(page.locator('#process .result tbody .recent-trend')).toHaveCount(12);
});

test('process analysis propagates its base period to overview and Brief', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const processInputs = page.locator('#process .date-pair:not(.compare) input[data-period-input]');
  await processInputs.nth(0).fill('2025-08-25');
  await processInputs.nth(1).fill('2025-08-27');
  await page.locator('#process .primary.full').click();
  const overviewInputs = page.locator('#overview .overview-period-filter input');
  await expect(overviewInputs.nth(0)).toHaveValue('2025-08-25');
  await expect(overviewInputs.nth(1)).toHaveValue('2025-08-27');
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  await expect(page.locator('#brief .page-head p')).toContainText('2025.08.25');
});

test('process analysis management comparison follows the selected base period', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const inputs = page.locator('#process input[data-period-input]');
  const usageTable = page.locator('#process .standard-comparison-result .usage-analysis-title').locator('..').locator('table').last();
  await inputs.nth(0).fill('2025-12-01');
  await inputs.nth(1).fill('2025-12-03');
  await page.locator('#process .primary.full').click();
  const first = await usageTable.locator('tbody tr').first().innerText();
  await inputs.nth(0).fill('2025-12-29');
  await inputs.nth(1).fill('2025-12-31');
  await page.locator('#process .primary.full').click();
  await expect(usageTable.locator('tbody tr').first()).not.toHaveText(first);
});

test('profit KPI comparison shows chemical A and B on the gas-volume unit basis', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const usageTable = page.locator('#process .standard-comparison-result .usage-analysis-title').locator('..').locator('table').last();
  await expect(usageTable).toContainText('약품 A 원단위');
  await expect(usageTable).toContainText('약품 B 원단위');
  await expect(usageTable).toContainText('kg/천Nm³');
});

test('diagnosis trend formats total-steam targets to one decimal place', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="diagnosis"]').click();
  await page.evaluate(() => window.renderDiagnosisFromEvent?.('EVENT_2025_02', { start: '2025-09-08', end: '2025-09-16' }));
  await expect(page.locator('#diagnosis .trend-summary')).toContainText('목표 15.1t/h');
  await expect(page.locator('#diagnosis .trend-summary')).not.toContainText('15.116217');
});

test('expanded steam module rows appear immediately below total steam usage', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  await page.locator('#process [data-analysis-mode="standard"]').click();
  const steamToggle = page.locator('#process .standard-comparison-result [data-toggle-steam-details]').first();
  if ((await steamToggle.innerText()).includes('세부 보기')) await steamToggle.click();
  const rows = page.locator('#process .standard-comparison-result table').first().locator('tbody tr');
  const labels = await rows.evaluateAll((items) => items.map((row) => row.innerText));
  const steamIndex = labels.findIndex((label) => label.includes('스팀 사용량'));
  expect(labels.slice(steamIndex + 1, steamIndex + 7).every((label, index) => label.includes(`스팀 M0${index + 1}`))).toBeTruthy();
});

test('process analysis quick range uses the current selected end date', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  const inputs = page.locator('#process input[data-period-input]');
  await inputs.nth(1).fill('2025-12-31');
  await page.locator('#process .quick button').first().click();
  await expect(inputs.nth(0)).toHaveValue('2025-12-30');
  await expect(inputs.nth(1)).toHaveValue('2025-12-31');
});

test('Brief Copilot shows no evidence or recommendations when the period has no issues', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  const copilot = page.locator('#brief .copilot-grid > div').last();
  await expect(copilot).toContainText('해당 기간 이상 없음');
  await expect(copilot).not.toContainText('권장 점검');
});

test('synthetic-data badges are not displayed', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.getByText('합성 데이터', { exact: true })).toHaveCount(0);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  await expect(page.getByText('합성 데이터', { exact: true })).toHaveCount(0);
});

test('overview profit impact uses a simple million-won summary', async ({ page }) => {
  await page.goto(appUrl);
  const summary = page.locator('#overview .period-profit-summary');
  await expect(summary).toContainText('백만원');
  await expect(summary).not.toContainText('₩');
  await expect(summary.locator('.profit-breakdown > span')).toHaveCount(3);
});

test('adjacent overview dates refresh both KPI and profit values', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const profit = page.locator('#overview .period-profit-summary > div > b');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-01');
  await filter.locator('button.primary').click();
  const firstProfit = await profit.innerText();
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-02');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-02');
  await filter.locator('button.primary').click();
  const secondProfit = await page.evaluate(() => window.CogDataService.getCostSummary({ start: '2025-12-02', end: '2025-12-02' }).actualProfitImpact);
  const firstProfitValue = await page.evaluate(() => window.CogDataService.getCostSummary({ start: '2025-12-01', end: '2025-12-01' }).actualProfitImpact);
  expect(secondProfit).not.toBe(firstProfitValue);
});

test('overview KPI status cards use the selected daily source row', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const normalCardValue = page.locator('#overview .spark-grid .spark').nth(2).locator(':scope > b');
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-01');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-01');
  await filter.locator('button.primary').click();
  const decemberFirst = await normalCardValue.innerText();
  await filter.locator('[data-period-input]').nth(0).fill('2025-12-02');
  await filter.locator('[data-period-input]').nth(1).fill('2025-12-02');
  await filter.locator('button.primary').click();
  await expect(normalCardValue).not.toHaveText(decemberFirst);
});

test('process overview reads the selected workbook daily KPI row', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  const inputs = view.locator('input[data-period-input]');
  await inputs.nth(0).fill('2024-01-01');
  await inputs.nth(1).fill('2024-01-01');
  await view.locator('[data-process-query]').click();
  await expect(view.locator('.process-data-table tbody')).toContainText('2024-01-01');
  await expect(view.locator('.process-data-table tbody')).toContainText('1,058');
  await inputs.nth(0).fill('2024-01-02');
  await inputs.nth(1).fill('2024-01-02');
  await view.locator('[data-process-query]').click();
  await expect(view.locator('.process-data-table tbody')).toContainText('2024-01-02');
  await expect(view.locator('.process-data-table tbody')).not.toContainText('1,058');
});

test('an hourly overview query uses only the selected hourly cost observation', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const profit = page.locator('#overview .period-profit-summary > div > b');
  await filter.locator('[data-time-mode]').evaluate((element) => { element.checked = true; element.dispatchEvent(new Event('change', { bubbles: true })); });
  await filter.locator('input').nth(0).fill('2025-12-01T07:00');
  await filter.locator('input').nth(1).fill('2025-12-01T07:00');
  await filter.locator('button.primary').click();
  const hourSeven = await profit.innerText();
  await filter.locator('input').nth(0).fill('2025-12-01T22:00');
  await filter.locator('input').nth(1).fill('2025-12-01T22:00');
  await filter.locator('button.primary').click();
  await expect(profit).not.toHaveText(hourSeven);
});

test('diagnosis shows all in-range issues or an explicit no-issue state', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  const filter = page.locator('#diagnosis .impact-period-filter');
  await filter.locator('[data-period-input]').nth(0).fill('2024-01-01');
  await filter.locator('[data-period-input]').nth(1).fill('2024-01-01');
  await filter.locator('button.primary').click();
  await expect(page.locator('#diagnosis .hero')).toContainText('이상 없음');
  await expect(page.locator('#diagnosis .two-col .card:last-child')).toContainText('점검 후보 없음');
  await expect(page.locator('#diagnosis .two-col .card:last-child')).not.toContainText('스팀 M01');
  await filter.locator('[data-period-input]').nth(0).fill('2025-09-08');
  await filter.locator('[data-period-input]').nth(1).fill('2025-09-19');
  await filter.locator('button.primary').click();
  await expect(page.locator('#diagnosis .hero')).not.toContainText('이상 없음');
  await expect(page.locator('#diagnosis .two-col .card:last-child')).not.toContainText('점검 후보 없음');
});
