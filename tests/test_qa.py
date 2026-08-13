import unittest

import pandas as pd

from synthetic_data.aggregate import build_daily_kpis
from synthetic_data.config import build_config, build_scenarios
from synthetic_data.generator import apply_scenario, build_event_table, generate_hourly_normal
from synthetic_data.qa import run_qa


class QATests(unittest.TestCase):
    def test_qa_reports_required_checks_as_passed(self):
        hourly = generate_hourly_normal(build_config())
        scenarios = build_scenarios()
        for scenario in scenarios:
            hourly = apply_scenario(hourly, scenario)
        checks = run_qa(hourly, build_daily_kpis(hourly), build_event_table(scenarios))
        self.assertTrue({
            "missing_or_duplicate",
            "kpi_formula",
            "relationship_direction",
            "scenario_lag",
            "event_flow",
        }.issubset(set(checks["check_name"])))
        self.assertTrue(checks["passed"].all())
