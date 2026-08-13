import json
import os
from pathlib import Path

import pandas as pd

ROOT = Path(os.environ["COG_ROOT"])
book = ROOT / "산출물" / "COG_합성데이터_2024_2025.xlsx"
out = ROOT / "_cost_work" / "cost_data.json"

hourly = pd.read_excel(book, sheet_name=0)
daily = pd.read_excel(book, sheet_name=1)
events = pd.read_excel(book, sheet_name=2)
steam_cols = [f"KPI_U04_STEAM_M0{i}" for i in range(1, 7)]
steam_daily = hourly.groupby("operation_date")[steam_cols].sum().sum(axis=1).rename("KPI_U04_STEAM_TOTAL").reset_index()
daily = daily.merge(steam_daily, on="operation_date")
daily["month"] = daily["operation_date"].str[:7]

daily_targets = {
    "gas": daily["KPI_U04_QTY_G01"].mean() * 0.99,
    "chem_a": daily["KPI_U04_CHEM_M01"].mean() * 1.01,
    "chem_b": daily["KPI_U04_CHEM_M02"].mean() * 1.01,
    "steam": daily["KPI_U04_STEAM_TOTAL"].mean() * 1.01,
}
columns = {"gas": "KPI_U04_QTY_G01", "chem_a": "KPI_U04_CHEM_M01", "chem_b": "KPI_U04_CHEM_M02", "steam": "KPI_U04_STEAM_TOTAL"}
directions = {"gas": "actual_minus_target", "chem_a": "target_minus_actual", "chem_b": "target_minus_actual", "steam": "target_minus_actual"}

price_rules = {
    "gas": {"2024": 300.0, "2025": 300.0, "적용률": 0.30, "단위": "원/Nm3", "변경주기": "연 1회"},
    "chem_a": {"2024": 154000.0, "2025": 154000.0, "단위": "원/kg", "변경주기": "연 1회"},
    "chem_b": {"2024": 128000.0, "2025": 128000.0, "단위": "원/kg", "변경주기": "연 1회"},
    "steam": {"2024_Q1": 1400000.0, "2024_Q2": 1500000.0, "2024_Q3": 1600000.0, "2024_Q4": 1500000.0,
              "2025_Q1": 1600000.0, "2025_Q2": 1700000.0, "2025_Q3": 1800000.0, "2025_Q4": 1700000.0,
              "단위": "원/ton", "변경주기": "분기 1회"},
}

def price(item, month):
    year = month[:4]
    if item != "steam":
        return price_rules[item][year]
    quarter = (int(month[5:7]) - 1) // 3 + 1
    return price_rules[item][f"{year}_Q{quarter}"]

def effective_price(item, month):
    return price(item, month) * price_rules[item].get("적용률", 1.0)

monthly_rows = []
for month, group in daily.groupby("month"):
    days = len(group)
    for item, column in columns.items():
        actual = float(group[column].sum())
        target = float(daily_targets[item] * days)
        delta = actual - target if item == "gas" else target - actual
        unit_price = effective_price(item, month)
        monthly_rows.append({
            "월": month,
            "원가항목": {"gas": "가스량", "chem_a": "약품 A", "chem_b": "약품 B", "steam": "스팀"}[item],
            "산식방향": directions[item],
            "실제사용_또는_실적": round(actual, 4),
            "목표량": round(target, 4),
            "차이": round(delta, 4),
            "가상단가": unit_price,
            "기본단가": price(item, month),
            "손익적용률": price_rules[item].get("적용률", 1.0),
            "단가단위": price_rules[item]["단위"],
            "손익영향금액": round(delta * unit_price, 2),
            "판정": "이익" if delta > 0 else "손해" if delta < 0 else "영향없음",
        })

event_rows = []
for _, event in events.iterrows():
    event_start = pd.Timestamp(event["PRECURSOR_START"])
    event_end = pd.Timestamp(event["RECOVERY_END"])
    event_days = daily.loc[(pd.to_datetime(daily["operation_date"]) >= event_start.normalize()) & (pd.to_datetime(daily["operation_date"]) <= event_end.normalize())].copy()
    if event_days.empty:
        continue
    for item, column in columns.items():
        actual = float(event_days[column].sum())
        target = float(daily_targets[item] * len(event_days))
        delta = actual - target if item == "gas" else target - actual
        event_month = f"{event_start.year}-{event_start.month:02d}"
        event_rows.append({
            "EVENT_ID": event["EVENT_ID"],
            "SCENARIO_ID": event["SCENARIO_ID"],
            "원가항목": {"gas": "가스량", "chem_a": "약품 A", "chem_b": "약품 B", "steam": "스팀"}[item],
            "이벤트_조업일수": len(event_days),
            "차이": round(delta, 4),
            "가상단가": effective_price(item, event_month),
            "기본단가": price(item, event_month),
            "손익적용률": price_rules[item].get("적용률", 1.0),
            "손익영향금액": round(delta * effective_price(item, event_month), 2),
        })

price_rows = []
for item, rule in price_rules.items():
    for key, value in rule.items():
        if key in {"단위", "변경주기", "적용률"}:
            continue
        price_rows.append({"원가항목": {"gas": "가스량", "chem_a": "약품 A", "chem_b": "약품 B", "steam": "스팀"}[item], "적용기간": key, "기본단가": value, "손익적용률": rule.get("적용률", 1.0), "손익반영단가": value * rule.get("적용률", 1.0), "단가단위": rule["단위"], "변경주기": rule["변경주기"]})

payload = {
    "formula": [
        ["가스량", "(실제 가스량 - 목표 가스량) × (가스 단가 × 30%)", "가스 매출 전체가 아닌 손익 반영률 30%만 적용; 목표보다 증가면 이익, 감소면 손해"],
        ["약품", "(목표 약품 사용량 - 실제 약품 사용량) × 약품 단가", "목표보다 증가면 손해, 감소면 이익"],
        ["스팀", "(목표 스팀 사용량 - 실제 스팀 사용량) × 스팀 단가", "목표보다 증가면 손해, 감소면 이익"],
    ],
    "targets": [{"원가항목": k, "일목표량": v} for k, v in daily_targets.items()],
    "prices": price_rows,
    "monthly": monthly_rows,
    "events": event_rows,
}
out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
print(f"MONTHLY_ROWS={len(monthly_rows)} EVENT_ROWS={len(event_rows)}")
