import unittest

import pandas as pd

from synthetic_data.aggregate import assign_operation_day, build_daily_kpis


class AggregateTests(unittest.TestCase):
    def test_operation_day_changes_at_0700(self):
        hourly = pd.DataFrame({
            "timestamp": pd.to_datetime(["2024-01-02 06:00", "2024-01-02 07:00"]),
            "KPI_U04_QTY_G01": [1.0, 1.0],
            "VAR_U04_FEED_U02": [1.0, 1.0],
            "KPI_U04_OUT_P01": [1.0, 1.0],
            "KPI_U04_OUT_P02": [1.0, 1.0],
            "KPI_U04_OUT_P03": [1.0, 1.0],
            "KPI_U04_CHEM_M01": [1.0, 1.0],
            "KPI_U04_CHEM_M02": [1.0, 1.0],
            "KPI_U04_CONTAIN_S01": [1.0, 1.0],
        })
        assigned = assign_operation_day(hourly)
        self.assertEqual(assigned.loc[0, "operation_date"], "2024-01-01")
        self.assertEqual(assigned.loc[1, "operation_date"], "2024-01-02")

    def test_daily_kpi_formula_uses_aggregated_production_and_feed(self):
        hourly = pd.DataFrame({
            "timestamp": pd.date_range("2024-01-01 07:00", periods=24, freq="h"),
            "KPI_U04_QTY_G01": [2.0] * 24,
            "VAR_U04_FEED_U02": [4.0] * 24,
            "KPI_U04_OUT_P01": [1.0] * 24,
            "KPI_U04_OUT_P02": [2.0] * 24,
            "KPI_U04_OUT_P03": [3.0] * 24,
            "KPI_U04_CHEM_M01": [1.0] * 24,
            "KPI_U04_CHEM_M02": [2.0] * 24,
            "KPI_U04_CONTAIN_S01": [0.5] * 24,
        })
        row = build_daily_kpis(hourly).iloc[0]
        self.assertAlmostEqual(row["KPI_U04_UI_P01"], row["KPI_U04_OUT_P01"] * 1000 / row["VAR_U04_FEED_U02"])
        self.assertAlmostEqual(row["KPI_U04_CHEM_U02"], row["KPI_U04_CHEM_M02"] * 1000 / row["KPI_U04_QTY_G01"])
