import unittest

import pandas as pd

from synthetic_data.config import build_config, build_scenarios
from synthetic_data.generator import apply_requested_scales, apply_scenario, generate_hourly_normal


class GeneratorTests(unittest.TestCase):
    def test_config_has_exact_hourly_range_and_seed(self):
        config = build_config()
        self.assertEqual(config.start, "2024-01-01 07:00")
        self.assertEqual(config.end, "2026-01-01 06:00")
        self.assertIsInstance(config.seed, int)


    def test_scenario_calendar_has_required_distribution(self):
        scenarios = build_scenarios()
        self.assertEqual(
            [scenario.scenario_id for scenario in scenarios],
            ["SCN_EX02", "SCN_EX03", "SCN_EX06", "SCN_EX07", "SCN_EX07"],
        )
        self.assertEqual(sum(scenario.abnormal_start.year == 2024 for scenario in scenarios), 3)
        self.assertEqual(sum(scenario.abnormal_start.year == 2025 for scenario in scenarios), 2)


    def test_normal_generation_has_complete_unique_hourly_index(self):
        hourly = generate_hourly_normal(build_config())
        self.assertEqual(len(hourly), 17_544)
        self.assertTrue(hourly["timestamp"].is_unique)
        self.assertEqual(hourly.isna().sum().sum(), 0)


    def test_normal_generation_is_reproducible_and_nonnegative(self):
        first = generate_hourly_normal(build_config())
        second = generate_hourly_normal(build_config())
        self.assertTrue(first.equals(second))
        self.assertTrue((first.select_dtypes("number") >= 0).all().all())

    def test_each_scenario_has_precursor_abnormal_and_recovery(self):
        base = generate_hourly_normal(build_config())
        for scenario in build_scenarios():
            result = apply_scenario(base.copy(), scenario)
            self.assertLess(scenario.precursor_start, scenario.abnormal_start)
            self.assertLess(scenario.abnormal_start, scenario.recovery_start)
            self.assertLess(scenario.recovery_start, scenario.recovery_end)
            phase = result.loc[result["timestamp"].eq(scenario.abnormal_start), "event_phase"].iloc[0]
            self.assertEqual(phase, "abnormal")

    def test_ex06_temperature_rise_precedes_ddd_increase(self):
        base = generate_hourly_normal(build_config())
        scenario = next(item for item in build_scenarios() if item.scenario_id == "SCN_EX06")
        result = apply_scenario(base.copy(), scenario)
        driver_change = result.loc[result.timestamp.eq(scenario.abnormal_start), "VAR_U04_TEMP_P03"].iloc[0] - base.loc[base.timestamp.eq(scenario.abnormal_start), "VAR_U04_TEMP_P03"].iloc[0]
        target_time = scenario.abnormal_start + pd.Timedelta(hours=scenario.lag_hours["KPI_U04_CONTAIN_S01"])
        target_change = result.loc[result.timestamp.eq(target_time), "KPI_U04_CONTAIN_S01"].iloc[0] - base.loc[base.timestamp.eq(target_time), "KPI_U04_CONTAIN_S01"].iloc[0]
        self.assertGreater(driver_change, 0)
        self.assertGreater(target_change, 0)

    def test_requested_scale_changes_apply_only_to_target_process_values(self):
        source = pd.DataFrame({
            "KPI_U04_QTY_G01": [2.0],
            "KPI_U04_OUT_P01": [3.0],
            "KPI_U04_OUT_P02": [4.0],
            "KPI_U04_OUT_P03": [5.0],
            "KPI_U04_STEAM_M01": [20.0],
            "KPI_U04_STEAM_M06": [40.0],
            "VAR_U04_FLOW_H02": [7.0],
        })
        result = apply_requested_scales(source)
        self.assertEqual(result.loc[0, "KPI_U04_QTY_G01"], 100.0)
        self.assertEqual(result.loc[0, "KPI_U04_OUT_P01"], 150.0)
        self.assertEqual(result.loc[0, "KPI_U04_OUT_P02"], 200.0)
        self.assertEqual(result.loc[0, "KPI_U04_OUT_P03"], 100.0)
        self.assertEqual(result.loc[0, "KPI_U04_STEAM_M01"], 1.0)
        self.assertEqual(result.loc[0, "KPI_U04_STEAM_M06"], 2.0)
        self.assertEqual(result.loc[0, "VAR_U04_FLOW_H02"], 7.0)
