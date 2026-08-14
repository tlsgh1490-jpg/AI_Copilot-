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
  await filter.locator('input').nth(0).fill('2025-09-01T07:00');
  await filter.locator('input').nth(1).fill('2025-09-30T07:00');
  await filter.getByRole('button', { name: '조회' }).click();
  await expect(page.locator('#overview .period-profit-summary > div > b')).not.toHaveText(before);
  await expect(page.locator('#overview .spark').first()).not.toHaveAttribute('data-trend-periods', trendBefore || '');
  expect((await page.locator('#overview .spark').first().getAttribute('data-trend-periods')).split(',').length).toBeGreaterThanOrEqual(5);
  await expect(page.locator('#overview .profit-breakdown span').first()).toContainText('백만원');
});

test('overview starts on the latest available source date', async ({ page }) => {
  await page.goto(appUrl);
  const inputs = page.locator('#overview .overview-period-filter input');
  await expect(inputs.nth(0)).toHaveValue('2025-12-31T07:00');
  await expect(inputs.nth(1)).toHaveValue('2025-12-31T07:00');
});

test('overview quick ranges refresh KPI trends and profit data', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const profit = page.locator('#overview .period-profit-summary > div > b');
  const spark = page.locator('#overview .spark').first();
  await filter.locator('button[data-overview-range="1"]').click();
  const oneDayProfit = await profit.innerText();
  const oneDayPeriods = await spark.getAttribute('data-trend-periods');
  await expect(filter.locator('input').nth(0)).toHaveValue('2025-12-30T07:00');
  await filter.locator('button[data-overview-range="30"]').click();
  await expect(profit).not.toHaveText(oneDayProfit);
  await expect(spark).not.toHaveAttribute('data-trend-periods', oneDayPeriods || '');
  await expect(page.locator('#overview .kpi-status-board tbody tr')).not.toHaveCount(0);
});

test('KPI status values change when the selected range changes within one month', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const purified = page.locator('#overview .kpi-status-board tbody tr').filter({ hasText: '정제량' }).locator('td').nth(2).locator('b');
  await filter.locator('input').nth(0).fill('2025-12-01T07:00');
  await filter.locator('input').nth(1).fill('2025-12-12T07:00');
  await filter.locator('button.primary').click();
  const first = await purified.innerText();
  await filter.locator('input').nth(0).fill('2025-12-05T07:00');
  await filter.locator('input').nth(1).fill('2025-12-12T07:00');
  await filter.locator('button.primary').click();
  await expect(purified).not.toHaveText(first);
});

test('quality content card displays the selected-period average with sufficient precision', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const card = page.locator('#overview .spark-grid .spark').first().locator(':scope > b');
  await filter.locator('input').nth(0).fill('2025-12-01T07:00');
  await filter.locator('input').nth(1).fill('2025-12-12T07:00');
  await filter.locator('button.primary').click();
  const first = await card.innerText();
  await filter.locator('input').nth(0).fill('2025-12-05T07:00');
  await filter.locator('input').nth(1).fill('2025-12-12T07:00');
  await filter.locator('button.primary').click();
  const second = await card.innerText();
  expect(first).not.toBe(second);
  expect(first).toMatch(/0\.7\d{2}/);
});

test('overview period changes are carried into lower screens', async ({ page }) => {
  await page.goto(appUrl);
  const overviewFilter = page.locator('#overview .overview-period-filter');
  await overviewFilter.locator('button[data-overview-range="7"]').click();
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  await expect(page.locator('#cost .impact-period-filter input').nth(0)).toHaveValue('2025-12-24T07:00');
  await expect(page.locator('#cost .impact-period-filter input').nth(1)).toHaveValue('2025-12-31T07:00');
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  await expect(page.locator('#diagnosis .impact-period-filter input').nth(0)).toHaveValue('2025-12-24T07:00');
  await expect(page.locator('#diagnosis .impact-period-filter input').nth(1)).toHaveValue('2025-12-31T07:00');
});

test('diagnosis identifies the in-range event only when its KPI is actually abnormal', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="diagnosis"]').click();
  const filter = page.locator('#diagnosis .impact-period-filter');
  await filter.locator('input').nth(0).fill('2025-08-18T07:00');
  await filter.locator('input').nth(1).fill('2025-09-12T07:00');
  await filter.locator('button.primary').click();
  const title = page.locator('#diagnosis .hero h2');
  await expect(title).toContainText('EVENT_');
});

test('cost period filter refreshes monthly table to selected month', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="cost"]').click();
  const filter = page.locator('#cost .impact-period-filter');
  await filter.locator('input').nth(0).fill('2025-10-01T07:00');
  await filter.locator('input').nth(1).fill('2025-10-31T07:00');
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
  await filter.locator('input').nth(0).fill('2025-09-01T07:00');
  await filter.locator('input').nth(1).fill('2025-09-30T07:00');
  await filter.locator('button.primary').click();
  await expect(page.locator('#cost .profit-item-charts .profit-item-chart h4')).toHaveText('약품 A');
  await expect(page.locator('#cost .period-summary b').first()).not.toHaveText(before);
});

test('overview and brief KPI detail toggles reveal additional shared KPI rows', async ({ page }) => {
  await page.goto(appUrl);
  const overviewRows = page.locator('#overview .kpi-status-board tbody tr');
  const beforeOverview = await overviewRows.count();
  await page.locator('#overview .kpi-detail-toggle').click();
  await expect(overviewRows).toHaveCount(23);
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  const briefRows = page.locator('#brief table.simple-table tbody tr');
  const beforeBrief = await briefRows.count();
  await page.locator('#brief .brief-kpi-detail-toggle').click();
  expect(beforeOverview).toBe(3);
  expect(beforeBrief).toBe(3);
  await expect(briefRows).toHaveCount(23);
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
  await expect(chart.locator('svg .profit-month').first()).toHaveText(`25.${selectedStart.slice(5, 7)}`);
  await page.locator('#cost .impact-period-filter input').nth(0).fill('2025-10-01T07:00');
  await page.locator('#cost .impact-period-filter input').nth(1).fill('2025-10-31T07:00');
  await page.locator('#cost .impact-period-filter button.primary').click();
  await expect(chart.locator('.profit-chart-summary b')).not.toHaveText(before);
});

test('daily profit periods produce different prorated results', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const total = page.locator('#overview .period-profit-summary > div > b');
  await filter.locator('input').nth(0).fill('2025-12-01T07:00');
  await filter.locator('input').nth(1).fill('2025-12-02T07:00');
  await filter.locator('button.primary').click();
  const twoDays = await total.innerText();
  await filter.locator('input').nth(1).fill('2025-12-08T07:00');
  await filter.locator('button.primary').click();
  await expect(total).not.toHaveText(twoDays);
});

test('operations and brief links open process overview with the selected range', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('input').nth(0).fill('2025-12-08T07:00');
  await filter.locator('input').nth(1).fill('2025-12-10T07:00');
  await filter.locator('button.primary').click();
  await page.locator('#overview [data-view="process"]').click();
  await expect(page.locator('#processOverview')).toHaveClass(/active/);
  await expect(page.locator('#processOverview input[type="datetime-local"]').first()).toHaveValue('2025-12-08T07:00');
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  await page.locator('#brief [data-view="process"]').click();
  await expect(page.locator('#processOverview')).toHaveClass(/active/);
});

test('process overview exposes all KPI and process-variable selectors', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  await expect(page.locator('#processOverview .metric-checks input')).toHaveCount(23);
  await expect(page.locator('#processOverview .metric-checks')).toContainText('총괄열전달계수');
  await expect(page.locator('#processOverview .metric-checks')).toContainText('배기 흡입속도');
  const count = page.locator('#processOverview .visible-count');
  await expect(count).toHaveText('23개');
  await page.locator('#processOverview .metric-selector summary').click();
  await page.locator('#processOverview .metric-checks input').nth(0).uncheck();
  await expect(count).toHaveText('22개');
});

test('overview spark cards match the selected period KPI summaries', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  await filter.locator('input').nth(0).fill('2025-12-20T07:00');
  await filter.locator('input').nth(1).fill('2025-12-26T07:00');
  await filter.locator('button.primary').click();
  const cards = page.locator('#overview .spark-grid .spark');
  const values = [];
  for (let i = 0; i < await cards.count(); i += 1) values.push(await cards.nth(i).locator(':scope > b').innerText());
  const expected = await page.evaluate(() => Object.fromEntries(window.CogDataService.getKpiSummaries({ start: '2025-12-20T07:00', end: '2025-12-26T07:00' }).map((item) => [item.id, { value: item.value, decimals: item.decimals }])));
  const cardIds = ['qualityContent', 'steamUsage', 'purifiedVolume', 'gasOutletTemp'];
  expect(values.map((text, index) => text.replace(/,/g, '').split(' ')[0])).toEqual(cardIds.map((id) => expected[id].value.toFixed(expected[id].decimals)));
  const firstPeriod = [...values];
  await filter.locator('input').nth(0).fill('2025-12-27T07:00');
  await filter.locator('input').nth(1).fill('2025-12-31T07:00');
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
  await expect(selects.nth(1).locator('option')).toHaveCount(15);
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
  const processInputs = page.locator('#process input[type="datetime-local"]');
  await processInputs.nth(0).fill('2025-08-25T07:00');
  await processInputs.nth(1).fill('2025-08-27T07:00');
  await page.locator('#process .primary.full').click();
  const overviewInputs = page.locator('#overview .overview-period-filter input');
  await expect(overviewInputs.nth(0)).toHaveValue('2025-08-25T07:00');
  await expect(overviewInputs.nth(1)).toHaveValue('2025-08-27T07:00');
  await page.locator('.sidebar .subnav [data-view="brief"]').click();
  await expect(page.locator('#brief .page-head p')).toContainText('2025.08.25');
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
  await filter.locator('input').nth(0).fill('2025-12-01T07:00');
  await filter.locator('input').nth(1).fill('2025-12-01T07:00');
  await filter.locator('button.primary').click();
  const firstProfit = await profit.innerText();
  await filter.locator('input').nth(0).fill('2025-12-02T07:00');
  await filter.locator('input').nth(1).fill('2025-12-02T07:00');
  await filter.locator('button.primary').click();
  await expect(profit).not.toHaveText(firstProfit);
});

test('overview KPI status cards use the selected daily source row', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const normalCardValue = page.locator('#overview .spark-grid .spark').nth(2).locator(':scope > b');
  await filter.locator('input').nth(0).fill('2025-12-01T07:00');
  await filter.locator('input').nth(1).fill('2025-12-01T07:00');
  await filter.locator('button.primary').click();
  const decemberFirst = await normalCardValue.innerText();
  await filter.locator('input').nth(0).fill('2025-12-02T07:00');
  await filter.locator('input').nth(1).fill('2025-12-02T07:00');
  await filter.locator('button.primary').click();
  await expect(normalCardValue).not.toHaveText(decemberFirst);
});

test('process overview reads the selected workbook daily KPI row', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('.sidebar .subnav [data-view="processOverview"]').click();
  const view = page.locator('#processOverview');
  const inputs = view.locator('input[type="datetime-local"]');
  await inputs.nth(0).fill('2024-01-01T07:00');
  await inputs.nth(1).fill('2024-01-01T07:00');
  await view.locator('[data-process-query]').click();
  await expect(view.locator('.process-data-table tbody')).toContainText('2024-01-01');
  await expect(view.locator('.process-data-table tbody')).toContainText('1,058');
  await inputs.nth(0).fill('2024-01-02T07:00');
  await inputs.nth(1).fill('2024-01-02T07:00');
  await view.locator('[data-process-query]').click();
  await expect(view.locator('.process-data-table tbody')).toContainText('2024-01-02');
  await expect(view.locator('.process-data-table tbody')).not.toContainText('1,058');
});

test('an hourly overview query uses only the selected hourly cost observation', async ({ page }) => {
  await page.goto(appUrl);
  const filter = page.locator('#overview .overview-period-filter');
  const profit = page.locator('#overview .period-profit-summary > div > b');
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
  await filter.locator('input').nth(0).fill('2024-01-01T07:00');
  await filter.locator('input').nth(1).fill('2024-01-01T07:00');
  await filter.locator('button.primary').click();
  await expect(page.locator('#diagnosis .hero')).toContainText('이상 없음');
  await expect(page.locator('#diagnosis .two-col .card:last-child')).toContainText('점검 후보 없음');
  await expect(page.locator('#diagnosis .two-col .card:last-child')).not.toContainText('스팀 M01');
  await filter.locator('input').nth(0).fill('2025-09-08T07:00');
  await filter.locator('input').nth(1).fill('2025-09-19T07:00');
  await filter.locator('button.primary').click();
  await expect(page.locator('#diagnosis .hero')).not.toContainText('이상 없음');
  await expect(page.locator('#diagnosis .two-col .card:last-child')).not.toContainText('점검 후보 없음');
});
