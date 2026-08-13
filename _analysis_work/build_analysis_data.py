import json, os
from pathlib import Path
import pandas as pd

ROOT=Path(os.environ['COG_ROOT']); book=ROOT/'산출물'/'COG_합성데이터_2024_2025.xlsx'; out=ROOT/'_analysis_work'/'analysis_data.json'
d=pd.read_excel(book,sheet_name=1); h=pd.read_excel(book,sheet_name=0); ev=pd.read_excel(book,sheet_name=2)
steam=[f'KPI_U04_STEAM_M0{i}' for i in range(1,7)]
s=h.groupby('operation_date')[steam].sum().sum(axis=1).rename('KPI_U04_STEAM_TOTAL').reset_index(); d=d.merge(s,on='operation_date')
std=pd.read_excel(ROOT/'산출물'/'COG_관리기준표.xlsx',sheet_name=1,header=2); std=std[std.iloc[:,0].notna()]
rows=[]
def classify(x,r):
    status='정상'
    if pd.notna(r.iloc[10]) and x<float(r.iloc[10]): status='이상'
    if pd.notna(r.iloc[11]) and x>float(r.iloc[11]): status='이상'
    if pd.notna(r.iloc[6]) and float(r.iloc[6])<=x<=float(r.iloc[7]): status='주의'
    if pd.notna(r.iloc[8]) and float(r.iloc[8])<=x<=float(r.iloc[9]): status='주의'
    return status
for _,r in std.iterrows():
    key,name=r.iloc[0],r.iloc[1]; raw=[]
    for x in d[key]: raw.append(classify(float(x),r))
    confirmed=[]; streak=0; prev='정상'
    for st in raw:
        streak=streak+1 if st==prev else 1
        confirmed.append(st if ((st=='이상' and streak>=2) or (st=='주의' and streak>=2)) else '정상')
        prev=st
    for i,(_,day) in enumerate(d.iterrows()): rows.append({'조업일':day['operation_date'],'KPI_ID':key,'관리항목':name,'실적값':round(float(day[key]),4),'원판정':raw[i],'연속판정':confirmed[i],'연속기준':'2일 연속'})

event_rows=[]
scenario_info={'SCN_EX02':('휘발분 저하','A/B 생산량·원단위 저하','휘발분과 생산량을 우선 점검'),'SCN_EX03':('스팀 M05/M06 저하','B 생산량·원단위 저하','스팀 M05/M06과 B 라인 확인'),'SCN_EX06':('가스 출구온도 상승','품질함량 상승','출구온도·설비 차압 확인'),'SCN_EX07':('스팀 M01~M04 저하','품질함량 상승','스팀 M01~M04와 열교환 상태 확인')}
for _,r in ev.iterrows():
    info=scenario_info.get(r.iloc[1],('시나리오 영향','영향 KPI 확인','관련 선행변수 우선 점검'))
    event_rows.append({'EVENT_ID':r.iloc[0],'SCENARIO_ID':r.iloc[1],'전조시작':r.iloc[2],'이상시작':r.iloc[3],'회복시작':r.iloc[4],'회복완료':r.iloc[5],'예상원인':info[0],'영향KPI':info[1],'점검우선순위':info[2],'판정문구':'합성 시나리오 기반 점검 후보이며 실제 원인 확정 아님'})
payload={'daily_status':rows,'event_analysis':event_rows,'rules':[['시간단위 변수','3시간 연속 이탈 시 확정'],['일별 KPI','2일 연속 이탈 시 확정'],['주의','연속 조건 충족 전 후보 상태'],['이상','연속 조건 충족 후 분석 이벤트 후보']]}
out.write_text(json.dumps(payload,ensure_ascii=False,default=str),encoding='utf-8'); print('DAILY_STATUS_ROWS=',len(rows),'EVENT_ROWS=',len(event_rows))
