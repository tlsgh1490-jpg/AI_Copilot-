from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class GeneratorConfig:
    start: str = "2024-01-01 07:00"
    end: str = "2026-01-01 06:00"
    seed: int = 20260811


@dataclass(frozen=True)
class ScenarioDefinition:
    scenario_id: str
    event_id: str
    precursor_start: pd.Timestamp
    abnormal_start: pd.Timestamp
    recovery_start: pd.Timestamp
    recovery_end: pd.Timestamp
    driver_ids: tuple[str, ...]
    target_ids: tuple[str, ...]
    driver_direction: int
    lag_hours: dict[str, int]


def build_config() -> GeneratorConfig:
    return GeneratorConfig()


def build_scenarios() -> list[ScenarioDefinition]:
    return [
        ScenarioDefinition(
            "SCN_EX02", "EVENT_2024_01", pd.Timestamp("2024-02-12 07:00"),
            pd.Timestamp("2024-02-14 07:00"), pd.Timestamp("2024-02-19 07:00"),
            pd.Timestamp("2024-02-22 07:00"), ("VAR_U04_VM_U03",),
            ("KPI_U04_OUT_P01", "KPI_U04_OUT_P02", "KPI_U04_UI_P01", "KPI_U04_UI_P02"), -1,
            {"KPI_U04_OUT_P01": 8, "KPI_U04_OUT_P02": 10, "KPI_U04_UI_P01": 10, "KPI_U04_UI_P02": 12},
        ),
        ScenarioDefinition(
            "SCN_EX03", "EVENT_2024_02", pd.Timestamp("2024-06-03 07:00"),
            pd.Timestamp("2024-06-05 07:00"), pd.Timestamp("2024-06-10 07:00"),
            pd.Timestamp("2024-06-13 07:00"), ("KPI_U04_STEAM_M05", "KPI_U04_STEAM_M06"),
            ("KPI_U04_OUT_P02", "KPI_U04_UI_P02"), -1,
            {"KPI_U04_OUT_P02": 5, "KPI_U04_UI_P02": 8},
        ),
        ScenarioDefinition(
            "SCN_EX06", "EVENT_2024_03", pd.Timestamp("2024-10-07 07:00"),
            pd.Timestamp("2024-10-09 07:00"), pd.Timestamp("2024-10-14 07:00"),
            pd.Timestamp("2024-10-17 07:00"), ("VAR_U04_TEMP_P03",),
            ("KPI_U04_CONTAIN_S01",), 1, {"KPI_U04_CONTAIN_S01": 5},
        ),
        ScenarioDefinition(
            "SCN_EX07", "EVENT_2025_01", pd.Timestamp("2025-03-10 07:00"),
            pd.Timestamp("2025-03-12 07:00"), pd.Timestamp("2025-03-17 07:00"),
            pd.Timestamp("2025-03-20 07:00"),
            ("KPI_U04_STEAM_M01", "KPI_U04_STEAM_M02", "KPI_U04_STEAM_M03", "KPI_U04_STEAM_M04"),
            ("KPI_U04_CONTAIN_S01",), -1, {"KPI_U04_CONTAIN_S01": 4},
        ),
        ScenarioDefinition(
            "SCN_EX07", "EVENT_2025_02", pd.Timestamp("2025-09-08 07:00"),
            pd.Timestamp("2025-09-10 07:00"), pd.Timestamp("2025-09-16 07:00"),
            pd.Timestamp("2025-09-19 07:00"),
            ("KPI_U04_STEAM_M01", "KPI_U04_STEAM_M02", "KPI_U04_STEAM_M03", "KPI_U04_STEAM_M04"),
            ("KPI_U04_CONTAIN_S01",), -1, {"KPI_U04_CONTAIN_S01": 6},
        ),
    ]
