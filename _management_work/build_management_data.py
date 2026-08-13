import json
import os
from pathlib import Path

import pandas as pd


ROOT = Path(os.environ["COG_ROOT"])
TEMPLATE = ROOT / "엑셀 양식" / "coke_oven_gas_dummy_data_input_template.rev.2.xlsx"
OUTPUT = ROOT / "산출물" / "COG_합성데이터_2024_2025.xlsx"
DEST = ROOT / "_management_work" / "management_data.json"

hourly = pd.read_excel(OUTPUT, sheet_name=0)
daily = pd.read_excel(OUTPUT, sheet_name=1)
events = pd.read_excel(OUTPUT, sheet_name=2)
kpi_meta = pd.read_excel(TEMPLATE, sheet_name=1, header=3)
variable_meta = pd.read_excel(TEMPLATE, sheet_name=2, header=3)

kpi_meta = kpi_meta.dropna(subset=["KPI_ID"])
variable_meta = variable_meta.dropna(subset=["변수_ID"])
kpi_units = dict(zip(kpi_meta["KPI_ID"], kpi_meta["단위"]))
variable_units = dict(zip(variable_meta["변수_ID"], variable_meta["단위"]))
variable_names = dict(zip(variable_meta["변수_ID"], variable_meta["변수명"]))
variable_cycles = dict(zip(variable_meta["변수_ID"], variable_meta["데이터 주기"]))

normal_hourly = hourly.loc[hourly["event_phase"].eq("normal")].copy()
event_days = set(hourly.loc[~hourly["event_phase"].eq("normal"), "operation_date"])
normal_daily = daily.loc[~daily["operation_date"].isin(event_days)].copy()

KPI_SPECS = [
    ("KPI_U04_QTY_G01", "정제량", "높을수록 좋음", 0.99, "two_sided"),
    ("KPI_U04_UI_P01", "A 생산원단위", "높을수록 좋음", 0.99, "higher_better"),
    ("KPI_U04_UI_P02", "B 생산원단위", "높을수록 좋음", 0.99, "higher_better"),
    ("KPI_U04_UI_P03", "C 생산원단위", "높을수록 좋음", 0.99, "higher_better"),
    ("KPI_U04_CHEM_U01", "약품 A 원단위", "낮을수록 좋음", 1.01, "lower_better"),
    ("KPI_U04_CHEM_U02", "약품 B 원단위", "낮을수록 좋음", 1.01, "lower_better"),
    ("KPI_U04_STEAM_TOTAL", "스팀 전체 사용량", "낮을수록 좋음", 1.01, "lower_better"),
    ("KPI_U04_CONTAIN_S01", "품질함량", "낮을수록 좋음", 1.01, "lower_better"),
]

steam_columns = [f"KPI_U04_STEAM_M0{i}" for i in range(1, 7)]
daily_steam = hourly.groupby("operation_date")[steam_columns].sum().sum(axis=1)
normal_steam = daily_steam.loc[~daily_steam.index.isin(event_days)]


def rounded(value: float) -> float:
    return round(float(value), 4)


kpi_rows = []
for kpi_id, name, direction, target_factor, rule_type in KPI_SPECS:
    series = normal_steam if kpi_id == "KPI_U04_STEAM_TOTAL" else normal_daily[kpi_id]
    reference = float(series.mean())
    target = reference * target_factor
    if rule_type == "two_sided":
        caution_low_low, caution_low_high = series.quantile(0.005), series.quantile(0.025)
        caution_high_low, caution_high_high = series.quantile(0.975), series.quantile(0.995)
        abnormal_low, abnormal_high = series.quantile(0.005), series.quantile(0.995)
        rule = "주의: 정상 P0.5~P2.5 또는 P97.5~P99.5; 이상: P0.5 미만 또는 P99.5 초과"
        normal_rule = "정상 P2.5~P97.5"
    elif rule_type == "higher_better":
        caution_low_low, caution_low_high = series.quantile(0.01), series.quantile(0.05)
        caution_high_low, caution_high_high = None, None
        abnormal_low, abnormal_high = series.quantile(0.01), None
        rule = "주의: 정상 P1~P5; 이상: P1 미만"
        normal_rule = "P5 이상"
    else:
        caution_low_low, caution_low_high = None, None
        caution_high_low, caution_high_high = series.quantile(0.95), series.quantile(0.99)
        abnormal_low, abnormal_high = None, series.quantile(0.99)
        rule = "주의: 정상 P95~P99; 이상: P99 초과"
        normal_rule = "P95 이하"
    unit = "ton/일" if kpi_id == "KPI_U04_STEAM_TOTAL" else kpi_units.get(kpi_id, "")
    kpi_rows.append({
        "KPI_ID": kpi_id,
        "관리항목": name,
        "단위": unit,
        "판정방향": direction,
        "정상기준값_평균": rounded(reference),
        "목표값": rounded(target),
        "주의_저구간_하한": None if caution_low_low is None else rounded(caution_low_low),
        "주의_저구간_상한": None if caution_low_high is None else rounded(caution_low_high),
        "주의_고구간_하한": None if caution_high_low is None else rounded(caution_high_low),
        "주의_고구간_상한": None if caution_high_high is None else rounded(caution_high_high),
        "이상_하한": None if abnormal_low is None else rounded(abnormal_low),
        "이상_상한": None if abnormal_high is None else rounded(abnormal_high),
        "주의_이상_규칙": rule,
        "정상판정": normal_rule,
    })

KPI_IDS = {row[0] for row in KPI_SPECS if row[0] != "KPI_U04_STEAM_TOTAL"}
variable_rows = []
important_ids = {
    "VAR_U04_FLOW_H02", "VAR_U04_RATIO_H03", "VAR_U04_TEMP_P03",
    "VAR_U04_TEMP_D01", "VAR_U04_FLOW_D02", "VAR_U04_U_D03",
}
for variable_id in variable_meta["변수_ID"].tolist():
    if variable_id in KPI_IDS or variable_id not in hourly.columns:
        continue
    source = normal_daily[variable_id] if variable_cycles.get(variable_id) == "1일" else normal_hourly[variable_id]
    normal_low, normal_high = source.quantile(0.025), source.quantile(0.975)
    caution_low, caution_high = source.quantile(0.005), source.quantile(0.995)
    basis = "정상 P2.5~P97.5, 주의 P0.5~P2.5 또는 P97.5~P99.5, 이상은 그 밖 (정상 구간 경고+이상 약 5%)"
    priority = "핵심 확인" if variable_id in important_ids else "범위 확인"
    variable_rows.append({
        "변수_ID": variable_id,
        "관리항목": variable_names.get(variable_id, variable_id),
        "단위": variable_units.get(variable_id, ""),
        "데이터주기": variable_cycles.get(variable_id, ""),
        "관리중요도": priority,
        "정상_하한": rounded(normal_low),
        "정상_상한": rounded(normal_high),
        "주의_하한": rounded(caution_low),
        "주의_상한": rounded(caution_high),
        "이상_하한": rounded(caution_low),
        "이상_상한": rounded(caution_high),
        "산정기준": basis,
    })

payload = {
    "overview": [
        ["관리기준 적용 범위", "Coke Oven Gas 단일 라인, 2024-01-01 07:00 ~ 2026-01-01 06:00"],
        ["정상 기준 데이터", f"시간 {len(normal_hourly):,}건 / 조업일 {len(normal_daily):,}일"],
        ["제외 기준", "이상 이벤트의 전조 시작부터 회복 완료까지 모든 변수·KPI 정상범위 산정에서 제외"],
        ["KPI 기준 방식", "목표값은 성과 비교용, 주의·이상 기준은 이벤트 제외 정상 데이터의 분위수(P1/P5/P95/P99 등)로 산정"],
        ["목표값 일치", "성과 목표 비교상 정상; 경고·이상은 데이터 기반 관리범위로 판정"],
        ["주의", "최초에는 지속시간 조건 없이 값 기준으로만 산정; UI 단계에서 3시간 지속 조건을 추가 가능"],
        ["보안 유의", "실제 운영 기준이 아닌 가상 합성데이터 기반 교육과제용 관리기준"],
    ],
    "kpis": kpi_rows,
    "variables": variable_rows,
    "events": events.to_dict(orient="records"),
}
DEST.write_text(json.dumps(payload, ensure_ascii=False, default=str), encoding="utf-8")
print(f"KPI_ROWS={len(kpi_rows)} VARIABLE_ROWS={len(variable_rows)} NORMAL_HOURS={len(normal_hourly)} NORMAL_DAYS={len(normal_daily)}")
