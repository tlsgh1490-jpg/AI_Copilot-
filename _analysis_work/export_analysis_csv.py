import json, os
from pathlib import Path
import pandas as pd

root=Path(os.environ['COG_ROOT'])
data=json.loads((root/'_analysis_work'/'analysis_data.json').read_text(encoding='utf-8'))
out=root/'산출물'
pd.DataFrame(data['daily_status']).to_csv(out/'일별_KPI_상태.csv',index=False,encoding='utf-8-sig')
pd.DataFrame(data['event_analysis']).to_csv(out/'이상_분석결과.csv',index=False,encoding='utf-8-sig')
pd.DataFrame([{'구분':r[0],'규칙':r[1]} for r in data['rules']]).to_csv(out/'분석_판정규칙.csv',index=False,encoding='utf-8-sig')
print('CSV_ANALYSIS_EXPORTED')
