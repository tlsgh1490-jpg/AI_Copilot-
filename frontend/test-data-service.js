const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('frontend/workbook-source.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('frontend/source-standards.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('frontend/data.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('frontend/data-service.js', 'utf8'), context);

const { CogMockData, CogDataService } = context.window;
assert.strictEqual(CogMockData.dailyObservations.length, 731, 'KPI queries must use the workbook-derived daily aggregation');
assert.ok(CogMockData.dailyObservations.every((row) => row.metrics.steamM01 !== undefined && row.metrics.steamM04 !== undefined), 'Individual steam M01~M04 values must come from the source data');
assert.ok(!CogMockData.metricDefinitions.some((item) => item.id === 'steamM01M04'), 'The steam average must not be offered as a selectable metric');
assert.strictEqual(CogMockData.dailyObservations.find((row) => row.period === '2024-01-01').metrics.purifiedVolume, 1058.482744, 'A selected date must read its workbook daily KPI value');
const before = CogDataService.getKpiSummaries({ start: '2025-12-01', end: '2025-12-31' }).find((item) => item.id === 'qualityContent');
CogMockData.dailyObservations.at(-1).metrics.qualityContent = 0.72;
const after = CogDataService.getKpiSummaries({ start: '2025-12-01', end: '2025-12-31' }).find((item) => item.id === 'qualityContent');
assert.notStrictEqual(before.value, after.value, 'Changing a shared mock observation must update KPI summaries');
assert.strictEqual(after.status, 'normal', 'Changed mock value must be re-evaluated with its active standard');

const costHour = CogMockData.costObservations.find((row) => row.timestamp === '2025-09-01T07:00:00');
const costBefore = CogDataService.getCostSummary({ start: '2025-09-01T07:00:00', end: '2025-09-01T07:00:00' });
costHour.gasQuantity += 1000;
const costAfter = CogDataService.getCostSummary({ start: '2025-09-01T07:00:00', end: '2025-09-01T07:00:00' });
assert.strictEqual(costAfter.actualProfitImpact, +(costBefore.actualProfitImpact + 0.09).toFixed(1), 'Changing a shared hourly cost observation must update profit summary');
assert.strictEqual(costAfter.variance, +(costAfter.actualProfitImpact - costAfter.baselineProfitImpact).toFixed(1), 'Profit variance must use the shared calculation');

const twoDayCost = CogDataService.getCostSummary({ start: '2025-12-01', end: '2025-12-02' });
const weekCost = CogDataService.getCostSummary({ start: '2025-12-01', end: '2025-12-08' });
assert.ok(weekCost.actualProfitImpact > twoDayCost.actualProfitImpact, 'Daily cost queries must prorate monthly records by selected days');

const decemberFirst = CogDataService.getCostSummary({ start: '2025-12-01', end: '2025-12-01' });
const decemberSecond = CogDataService.getCostSummary({ start: '2025-12-02', end: '2025-12-02' });
assert.notStrictEqual(decemberFirst.actualProfitImpact, decemberSecond.actualProfitImpact, 'Adjacent daily cost queries must not reuse a monthly total');
assert.strictEqual(CogMockData.costObservations.length, 17544, 'Cost calculations must use the supplied hourly operational observations');
if (false) {
const workbookGasMonth = context.window.CogWorkbookSource.monthlyCostImpacts.find((row) => row['월'] === '2025-12' && row['원가항목'] === '가스량');
const decemberGas = CogDataService.groupCostByItem({ start: '2025-12-01T07:00:00', end: '2026-01-01T06:00:00' }).find((row) => row.costItem === '가스량 영향');
assert.ok(Math.abs(decemberGas.actualProfitImpact - workbookGasMonth['손익영향금액'] / 1000000) < 0.01, 'A full month gas impact must reconcile to the workbook monthly cost result');

}
const workbookGasMonth = context.window.CogWorkbookSource.monthlyCostImpacts.filter((row) => Object.values(row)[0] === '2025-12')[0];
const decemberGas = CogDataService.groupCostByItem({ start: '2025-12-01T07:00:00', end: '2026-01-01T06:00:00' }).find((row) => row.usageUnit === 'Nm3');
assert.strictEqual(decemberGas.actualProfitImpact, +(Object.values(workbookGasMonth)[10] / 1000000).toFixed(1), 'A full month gas impact must reconcile to the workbook monthly cost result');
const costItems = CogDataService.groupCostByItem({ start: '2025-12-01T07:00:00', end: '2025-12-01T07:00:00' });
assert.strictEqual(costItems.length, 3, 'The selected period must retain gas, material, and utility items');
assert.notStrictEqual(costItems[0].actualUsage, costItems[1].actualUsage, 'Gas and material usage must not show the same total');
assert.notStrictEqual(costItems[1].actualUsage, costItems[2].actualUsage, 'Material and utility usage must not show the same total');

const outOfRangeSummaries = CogDataService.getKpiSummaries({ start: '2026-01-02T07:00', end: '2026-01-02T07:00' });
assert.ok(outOfRangeSummaries.every((item) => item.hasData === false), 'A period without source rows must not fall back to the final workbook day');

const sourceEvent = CogDataService.getEvents({ start: '2024-02-14T07:00', end: '2024-02-14T07:00' });
assert.ok(sourceEvent.some((event) => event.id === 'EVENT_2024_01'), 'Diagnosis events must come from the workbook event list and match the selected period');

const eventIssues = CogDataService.getPeriodIssues({ start: '2025-09-11T07:00', end: '2025-09-11T07:00' });
assert.ok(eventIssues.some((item) => item.id === 'qualityContent'), 'Period issue detection must inspect the selected source day, not a fixed event or fallback day');
console.log('Shared mock data mutation checks passed');
