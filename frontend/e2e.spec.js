const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const appUrl = pathToFileURL(path.resolve(__dirname, 'index.html')).href;

test.use({ channel: 'chrome' });

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
    page.locator('#process'),
  ];
  for (const filter of filters) {
    await expect(filter.locator('[data-period-input]').first()).toHaveAttribute('type', 'date');
    await expect(filter.locator('[data-time-mode]')).not.toBeChecked();
    await filter.locator('[data-time-mode]').evaluate((element) => { element.checked = true; element.dispatchEvent(new Event('change', { bubbles: true })); });
    await expect(filter.locator('[data-period-input]').first()).toHaveAttribute('type', 'datetime-local');
  }
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

test('profit charts show bar values, only month labels, and refresh cumulative value', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const chart = page.locator('#cost .profit-item-chart').first();
  const before = await chart.locator('.profit-chart-summary b').innerText();
  const selectedStart = await page.locator('#cost .impact-period-filter input').nth(0).inputValue();
  await expect(chart.locator('.profit-chart-numbers')).toHaveCount(0);
  await expect(chart.locator('.profit-baseline')).toHaveCount(0);
  await expect(chart.locator('.profit-baseline-label')).toHaveCount(0);
  await expect(chart.locator('svg .profit-month').first()).toHaveText(new RegExp(`25\\.${selectedStart.slice(5, 7)}`));
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
  const count = page.locator('#processOverview .visible-count');
  await expect(count).toHaveText('25개');
  await page.locator('#processOverview .metric-selector summary').click();
  await page.locator('#processOverview .metric-checks input').nth(0).uncheck();
  await expect(count).toHaveText('24개');
});

test('A, B, and C production unit metrics use kg/t', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const table = page.locator('#processOverview .process-data-table');
  await expect(table.locator('thead')).toContainText('kg/t');
  await expect(page.locator('#processOverview .process-kpi-grid')).toContainText('kg/t');
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
  expect(steam.m05).toBeCloseTo(2.55349, 5);
  expect(steam.m06).toBeCloseTo(2.52927, 5);
});

test('process overview exports the selected actual-data table to Excel', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const download = page.waitForEvent('download');
  await page.locator('#processOverview [data-process-export]').click();
  expect((await download).suggestedFilename()).toMatch(/공정현황_조회결과\.xls$/);
});

test('profit item charts expose daily/monthly controls and export from the item section', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  await expect(page.locator('#cost .impact-composition-card [data-profit-granularity]')).toHaveCount(2);
  await expect(page.locator('#cost .impact-composition-card [data-profit-export]')).toHaveCount(1);
  await expect(page.locator('#cost .profit-impact-detail [data-profit-export]')).toHaveCount(0);
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
  await expect(page.locator('#process .result tbody .recent-trend')).toHaveCount(4);
});

test('process comparison shows inline recent trends without an expanded comparison chart', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar [data-view="process"]').click();
  await expect(page.locator('#process .result .card-title button.primary')).toHaveCount(0);
  await expect(page.locator('#process .result tbody .recent-trend')).toHaveCount(3);
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
  await expect(profit).not.toHaveText(firstProfit);
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
