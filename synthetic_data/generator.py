import numpy as np
import pandas as pd

from .config import GeneratorConfig


def _smooth_noise(rng: np.random.Generator, length: int, scale: float, persistence: float = 0.92) -> np.ndarray:
    values = np.zeros(length)
    shocks = rng.normal(0, scale, length)
    for index in range(1, length):
        values[index] = persistence * values[index - 1] + shocks[index]
    return values


def generate_hourly_normal(config: GeneratorConfig) -> pd.DataFrame:
    timestamp = pd.date_range(config.start, config.end, freq="h")
    count = len(timestamp)
    rng = np.random.default_rng(config.seed)
    hour = timestamp.hour.to_numpy()
    day_of_year = timestamp.dayofyear.to_numpy()
    daily_cycle = np.sin(2 * np.pi * (hour - 7) / 24)
    seasonal_cycle = np.sin(2 * np.pi * (day_of_year - 80) / 366)

    utilization = np.clip(0.90 + 0.025 * daily_cycle + _smooth_noise(rng, count, 0.007), 0.78, 0.99)
    feed = np.clip(42 + 4.5 * utilization + _smooth_noise(rng, count, 0.22), 30, None)
    volatility = np.clip(27.0 + _smooth_noise(rng, count, 0.05, 0.985), 24, 31)
    concentration = np.clip(54 + 1.5 * utilization + _smooth_noise(rng, count, 0.16), 45, None)
    flow = np.clip(1450 + 150 * utilization + 7 * daily_cycle + _smooth_noise(rng, count, 9), 900, None)
    ratio = np.clip(1.65 + 0.09 * utilization + _smooth_noise(rng, count, 0.008), 1.25, None)
    temp_in = np.clip(43 + 0.10 * seasonal_cycle + _smooth_noise(rng, count, 0.08), 38, None)
    temp_out = np.clip(temp_in + 17.5 + 0.25 * ratio + _smooth_noise(rng, count, 0.10), 50, None)
    dp = np.clip(18 + 0.025 * flow + 2.2 * ratio + _smooth_noise(rng, count, 0.35), 15, None)
    device_temp = np.clip(61 + 0.4 * seasonal_cycle + _smooth_noise(rng, count, 0.12), 50, None)
    oil_flow = np.clip(7.8 + 0.35 * utilization + _smooth_noise(rng, count, 0.035), 5, None)
    ua = np.clip(0.94 + _smooth_noise(rng, count, 0.004), 0.85, 1.02)

    gas_qty = np.clip(flow * concentration / 100 + _smooth_noise(rng, count, 4), 1, None)
    p01 = np.clip(feed * (0.35 + 0.010 * (volatility - 27)) * utilization + _smooth_noise(rng, count, 0.18), 0.1, None)
    p02 = np.clip(feed * (0.24 + 0.008 * (volatility - 27)) * utilization + _smooth_noise(rng, count, 0.15), 0.1, None)
    p03 = np.clip(feed * (0.14 + 0.004 * (volatility - 27)) * utilization + _smooth_noise(rng, count, 0.10), 0.1, None)
    chem_m01 = np.clip(0.022 * gas_qty + 0.7 * ratio + _smooth_noise(rng, count, 0.08), 0.1, None)
    chem_m02 = np.clip(0.017 * gas_qty + 0.4 * concentration + _smooth_noise(rng, count, 0.08), 0.1, None)
    ui_p01 = np.clip(p01 * 1000 / feed, 0.1, None)
    ui_p02 = np.clip(p02 * 1000 / feed, 0.1, None)
    ui_p03 = np.clip(p03 * 1000 / feed, 0.1, None)
    chem_u01 = np.clip(chem_m01 * 1000 / gas_qty, 0.1, None)
    chem_u02 = np.clip(chem_m02 * 1000 / gas_qty, 0.1, None)
    ddd = np.clip(0.72 + 0.015 * (temp_out - 61) - 0.018 * (ratio - 1.7) - 0.004 * (concentration - 55) + _smooth_noise(rng, count, 0.012), 0.1, None)

    frame = pd.DataFrame({
        "timestamp": timestamp,
        "VAR_U04_UTIL_U01": utilization,
        "VAR_U04_FEED_U02": feed,
        "VAR_U04_VM_U03": volatility,
        "VAR_U04_CONC_H01": concentration,
        "VAR_U04_FLOW_H02": flow,
        "VAR_U04_RATIO_H03": ratio,
        "VAR_U04_TEMP_P02": temp_in,
        "VAR_U04_TEMP_P03": temp_out,
        "VAR_U04_DP_P04": dp,
        "VAR_U04_TEMP_D01": device_temp,
        "VAR_U04_FLOW_D02": oil_flow,
        "VAR_U04_U_D03": ua,
        "KPI_U04_QTY_G01": gas_qty,
        "KPI_U04_OUT_P01": p01,
        "KPI_U04_OUT_P02": p02,
        "KPI_U04_OUT_P03": p03,
        "KPI_U04_UI_P01": ui_p01,
        "KPI_U04_UI_P02": ui_p02,
        "KPI_U04_UI_P03": ui_p03,
        "KPI_U04_CHEM_M01": chem_m01,
        "KPI_U04_CHEM_M02": chem_m02,
        "KPI_U04_CHEM_U01": chem_u01,
        "KPI_U04_CHEM_U02": chem_u02,
        "KPI_U04_CONTAIN_S01": ddd,
        "event_id": "NONE",
        "scenario_id": "NONE",
        "event_phase": "normal",
    })
    for steam_index in range(1, 7):
        frame[f"KPI_U04_STEAM_M0{steam_index}"] = np.clip(
            4.5 + 0.6 * utilization + 0.15 * daily_cycle + _smooth_noise(rng, count, 0.05), 0.1, None
        )
    return apply_requested_scales(frame)


def apply_requested_scales(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    scale_factors = {
        "KPI_U04_QTY_G01": 50.0,
        "KPI_U04_OUT_P01": 50.0,
        "KPI_U04_OUT_P02": 50.0,
        "KPI_U04_OUT_P03": 20.0,
    }
    for column, factor in scale_factors.items():
        if column in result:
            result[column] = result[column] * factor
    for steam_index in range(1, 7):
        column = f"KPI_U04_STEAM_M0{steam_index}"
        if column in result:
            result[column] = result[column] / 20.0
    if {"KPI_U04_OUT_P01", "KPI_U04_OUT_P02", "KPI_U04_OUT_P03", "VAR_U04_FEED_U02"}.issubset(result.columns):
        result["KPI_U04_UI_P01"] = result["KPI_U04_OUT_P01"] / result["VAR_U04_FEED_U02"]
        result["KPI_U04_UI_P02"] = result["KPI_U04_OUT_P02"] / result["VAR_U04_FEED_U02"]
        result["KPI_U04_UI_P03"] = result["KPI_U04_OUT_P03"] / result["VAR_U04_FEED_U02"]
    if {"KPI_U04_CHEM_M01", "KPI_U04_CHEM_M02", "KPI_U04_QTY_G01"}.issubset(result.columns):
        result["KPI_U04_CHEM_U01"] = result["KPI_U04_CHEM_M01"] * 1000 / result["KPI_U04_QTY_G01"]
        result["KPI_U04_CHEM_U02"] = result["KPI_U04_CHEM_M02"] * 1000 / result["KPI_U04_QTY_G01"]
    return result


def _effect_weight(timestamp: pd.Series, scenario, lag_hours: int = 0) -> np.ndarray:
    effective_time = timestamp - pd.Timedelta(hours=lag_hours)
    weight = np.zeros(len(timestamp))
    precursor = (effective_time >= scenario.precursor_start) & (effective_time < scenario.abnormal_start)
    abnormal = (effective_time >= scenario.abnormal_start) & (effective_time < scenario.recovery_start)
    recovery = (effective_time >= scenario.recovery_start) & (effective_time <= scenario.recovery_end)
    precursor_span = max((scenario.abnormal_start - scenario.precursor_start).total_seconds(), 1)
    recovery_span = max((scenario.recovery_end - scenario.recovery_start).total_seconds(), 1)
    weight[precursor] = 0.10 + 0.25 * (
        (effective_time[precursor] - scenario.precursor_start).dt.total_seconds() / precursor_span
    )
    weight[abnormal] = 1.0
    weight[recovery] = 1.0 - (
        (effective_time[recovery] - scenario.recovery_start).dt.total_seconds() / recovery_span
    )
    return weight


def apply_scenario(frame: pd.DataFrame, scenario) -> pd.DataFrame:
    result = frame.copy()
    timestamp = result["timestamp"]
    driver_weight = _effect_weight(timestamp, scenario)
    driver_multiplier = 1 + scenario.driver_direction * 0.16 * driver_weight
    for driver_id in scenario.driver_ids:
        result[driver_id] = np.clip(result[driver_id] * driver_multiplier, 0.001, None)

    target_direction = scenario.driver_direction
    if scenario.scenario_id == "SCN_EX07":
        target_direction = 1
    for target_id in scenario.target_ids:
        target_weight = _effect_weight(timestamp, scenario, scenario.lag_hours[target_id])
        result[target_id] = np.clip(result[target_id] * (1 + target_direction * 0.14 * target_weight), 0.001, None)

    event_mask = (timestamp >= scenario.precursor_start) & (timestamp <= scenario.recovery_end)
    result.loc[event_mask, "event_id"] = scenario.event_id
    result.loc[event_mask, "scenario_id"] = scenario.scenario_id
    result.loc[(timestamp >= scenario.precursor_start) & (timestamp < scenario.abnormal_start), "event_phase"] = "precursor"
    result.loc[(timestamp >= scenario.abnormal_start) & (timestamp < scenario.recovery_start), "event_phase"] = "abnormal"
    result.loc[(timestamp >= scenario.recovery_start) & (timestamp <= scenario.recovery_end), "event_phase"] = "recovery"
    return result


def build_event_table(scenarios) -> pd.DataFrame:
    return pd.DataFrame([
        {
            "EVENT_ID": scenario.event_id,
            "SCENARIO_ID": scenario.scenario_id,
            "PRECURSOR_START": scenario.precursor_start,
            "ABNORMAL_START": scenario.abnormal_start,
            "RECOVERY_START": scenario.recovery_start,
            "RECOVERY_END": scenario.recovery_end,
            "DRIVER_IDS": ", ".join(scenario.driver_ids),
            "TARGET_IDS": ", ".join(scenario.target_ids),
            "LAG_HOURS": ", ".join(f"{key}:{value}" for key, value in scenario.lag_hours.items()),
        }
        for scenario in scenarios
    ])
