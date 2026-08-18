const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');

test.use({ channel: 'chrome' });
const appUrl = pathToFileURL(path.resolve(__dirname, 'index.html')).href;
const workbookPath = path.resolve(__dirname, '..', '산출물', 'COG_합성데이터_2024_2025.xlsx');
const pythonPath = 'C:\\Users\\POSCOFUTUREM\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

function excelExpected() {
  const py = String.raw`import json,sys,openpyxl,datetime
from collections import defaultdict
wb=openpyxl.load_workbook(sys.argv[1],read_only=True,data_only=True)
def read(i,skip=0):
 ws=wb.worksheets[i]; it=ws.iter_rows(values_only=True)
 for _ in range(skip): next(it)
 h=list(next(it)); return [list(r) for r in it if r and r[0] is not None]
daily=read(1); bydate={str(r[0]):r for r in daily}
cols=[('KPI_U04_QTY_G01',1000),('KPI_U04_UI_P01',1),('KPI_U04_UI_P02',1),('KPI_U04_UI_P03',1),('KPI_U04_CHEM_U01',1),('KPI_U04_CHEM_U02',1),('KPI_U04_CONTAIN_S01',1),('VAR_U04_TEMP_P03',1),('KPI_U04_STEAM_M01',1),('KPI_U04_STEAM_M02',1),('KPI_U04_STEAM_M03',1),('KPI_U04_STEAM_M04',1),('KPI_U04_STEAM_M05',1),('KPI_U04_STEAM_M06',1),('VAR_U04_DP_P04',1),('VAR_U04_FLOW_H02',1),('VAR_U04_RATIO_H03',1),('VAR_U04_TEMP_D01',1),('VAR_U04_FLOW_D02',1),('VAR_U04_U_D03',1),('VAR_U04_UTIL_U01',1),('VAR_U04_FEED_U02',1),('VAR_U04_VM_U03',1),('VAR_U04_CONC_H01',1)]
header=list(wb.worksheets[1].iter_rows(values_only=True))[0]
idx={v:i for i,v in enumerate(header)}
ids=['purifiedVolume','aUnit','bUnit','cUnit','chemicalA','chemicalB','qualityContent','gasOutletTemp','steamM01','steamM02','steamM03','steamM04','steamM05','steamM06','equipmentPressure','gasFlow','lgRatio','equipmentTemp','oilFlow','heatTransfer','gasPressure','steamPressure','coolingWaterTemp','exhaustSpeed']
daily_out={}
for d in ['2024-01-01','2025-09-10','2025-12-31']:
 r=bydate[d]; m={k:r[idx[c]]/div for k,(c,div) in zip(ids,cols)}; m['steamUsage']=sum(r[idx[f'KPI_U04_STEAM_M0{i}']] for i in range(1,7)); daily_out[d]=m
def op(ts):
 s=str(ts)[:19]; d=s[:10]; return d if int(s[11:13])>=7 else (datetime.date.fromisoformat(d)-datetime.timedelta(days=1)).isoformat()
hour_ws=wb.worksheets[0]; hi=list(hour_ws.iter_rows(values_only=True)); hh=list(hi[0]); hours=[list(r) for r in hi[1:] if r and r[0] is not None]; hidx={v:i for i,v in enumerate(hh)}
counts=defaultdict(int)
for r in hours: counts[op(r[hidx['timestamp']])[:7]]+=1
monthly=read(10,2); dec=[r for r in monthly if str(r[0])=='2025-12']
month_imp=[r[10]/1e6 for r in dec]
day=[r for r in hours if op(r[hidx['timestamp']])=='2025-12-31']; day_imp=[]
for r in dec:
 target=r[4]/counts['2025-12']*len(day); item_index=len(day_imp)
 if item_index==0: actual=sum(x[hidx['KPI_U04_QTY_G01']] for x in day)
 elif item_index==1: actual=sum(x[hidx['KPI_U04_CHEM_M01']] for x in day)
 elif item_index==2: actual=sum(x[hidx['KPI_U04_CHEM_M02']] for x in day)
 else: actual=sum(sum(x[hidx[f'KPI_U04_STEAM_M0{i}']] for i in range(1,7)) for x in day)
 day_imp.append(((actual-target) if str(r[2])=='actual_minus_target' else (target-actual))*r[6]/1e6)
ew=list(wb.worksheets[2].iter_rows(values_only=True)); events=[str(r[0]) for r in ew[1:] if r and r[0] is not None]
print(json.dumps({'daily':daily_out,'monthly':month_imp,'dayCost':day_imp,'events':events}))`;
  return JSON.parse(execFileSync(pythonPath, ['-c', py, workbookPath], { encoding: 'utf8' }));
}

test('all core screen data matches the Excel source for selected dates and periods', async ({ page }) => {
  const expected = excelExpected();
  await page.goto(appUrl);
  const actual = await page.evaluate(() => {
    const dates = ['2024-01-01','2025-09-10','2025-12-31'];
    const daily = Object.fromEntries(dates.map((date) => [date, Object.fromEntries(window.CogDataService.getKpiSummaries({ start: date, end: date, granularity: 'day' }).map((row) => [row.id, row.value]))]));
    const rows = window.CogDataService.getCostRecords({ start: '2025-12-01', end: '2025-12-31', granularity: 'month' });
    const dayRows = window.CogDataService.getCostRecords({ start: '2025-12-31', end: '2025-12-31', granularity: 'day' }).filter((row) => row.period === '2025-12-31');
    return { daily, monthly: rows.filter((row) => row.period === '2025-12').map((row) => row.actualProfitImpact), dayCost: dayRows.map((row) => row.actualProfitImpact), events: window.CogDataService.getEvents({ start: '1900-01-01', end: '2099-12-31' }).map((e) => e.id || e.eventId) };
  });
  for (const [date, metrics] of Object.entries(expected.daily)) for (const [metric, value] of Object.entries(metrics)) expect(actual.daily[date][metric], `${date} ${metric}`).toBeCloseTo(value, 3);
  expect(actual.monthly[0]).toBeCloseTo(expected.monthly[0], 3);
  expect(actual.monthly[1]).toBeCloseTo(expected.monthly[1] + expected.monthly[2], 3);
  expect(actual.monthly[2]).toBeCloseTo(expected.monthly[3], 3);
  expect(actual.dayCost[0]).toBeCloseTo(expected.dayCost[0], 3);
  expect(actual.dayCost[1]).toBeCloseTo(expected.dayCost[1] + expected.dayCost[2], 3);
  expect(actual.dayCost[2]).toBeCloseTo(expected.dayCost[3], 3);
  expect(actual.events.filter(Boolean).sort()).toEqual(expected.events.sort());
});
