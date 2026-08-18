import numpy as np
import pandas as pd


def _check(name: str, passed: bool, detail: str) -> dict[str, object]:
    return {"check_name": name, "passed": bool(passed), "detail": detail}


def run_qa(hourly: pd.DataFrame, daily: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:
    checks: list[dict[str, object]] = []
    missing = int(hourly.isna().sum().sum())
    duplicate = int(hourly["timestamp"].duplicated().sum())
    checks.append(_check(
        "missing_or_duplicate", missing == 0 and duplicate == 0 and len(hourly) == 17_544 and len(daily) == 731,
        f"hourly_rows={len(hourly)}, daily_rows={len(daily)}, missing={missing}, duplicate_timestamps={duplicate}",
    ))

    formula_checks = [
        np.allclose(daily["KPI_U04_UI_P01"], daily["KPI_U04_OUT_P01"] / daily["VAR_U04_FEED_U02"]),
        np.allclose(daily["KPI_U04_UI_P02"], daily["KPI_U04_OUT_P02"] / daily["VAR_U04_FEED_U02"]),
        np.allclose(daily["KPI_U04_UI_P03"], daily["KPI_U04_OUT_P03"] / daily["VAR_U04_FEED_U02"]),
        np.allclose(daily["KPI_U04_CHEM_U01"], daily["KPI_U04_CHEM_M01"] * 1000 / daily["KPI_U04_QTY_G01"]),
        np.allclose(daily["KPI_U04_CHEM_U02"], daily["KPI_U04_CHEM_M02"] * 1000 / daily["KPI_U04_QTY_G01"]),
    ]
    checks.append(_check("kpi_formula", all(formula_checks), "P01/P02/P03 and chemical unit-rate formulas recomputed"))

    normal = hourly.loc[hourly["event_phase"].eq("normal")]
    gas_flow_corr = normal["KPI_U04_QTY_G01"].corr(normal["VAR_U04_FLOW_H02"])
    temp_ddd_corr = normal["KPI_U04_CONTAIN_S01"].corr(normal["VAR_U04_TEMP_P03"])
    checks.append(_check(
        "relationship_direction", gas_flow_corr > 0.2 and temp_ddd_corr > 0.1,
        f"gas_flow_correlation={gas_flow_corr:.3f}, outlet_temp_ddd_correlation={temp_ddd_corr:.3f}",
    ))

    lag_ok = True
    for _, event in events.iterrows():
        abnormal_start = pd.Timestamp(event["ABNORMAL_START"])
        target_text = str(event["TARGET_IDS"]).split(", ")[0]
        lag_text = str(event["LAG_HOURS"]).split(", ")[0]
        lag = int(lag_text.rsplit(":", 1)[1])
        target_time = abnormal_start + pd.Timedelta(hours=lag)
        phase = hourly.loc[hourly["timestamp"].eq(target_time), "event_phase"]
        lag_ok = lag_ok and not phase.empty and phase.iloc[0] == "abnormal" and target_text in hourly.columns
    checks.append(_check("scenario_lag", lag_ok, "all configured target lags land inside abnormal phases"))

    ordered = all(
        pd.Timestamp(row.PRECURSOR_START) < pd.Timestamp(row.ABNORMAL_START) < pd.Timestamp(row.RECOVERY_START) < pd.Timestamp(row.RECOVERY_END)
        for row in events.itertuples()
    )
    phase_counts = hourly["event_phase"].value_counts()
    flow_ok = ordered and all(phase_counts.get(phase, 0) > 0 for phase in ["precursor", "abnormal", "recovery"])
    checks.append(_check("event_flow", flow_ok, f"events={len(events)}, phases={phase_counts.to_dict()}"))
    return pd.DataFrame(checks)
