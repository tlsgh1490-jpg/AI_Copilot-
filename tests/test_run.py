import tempfile
import unittest
from pathlib import Path

import pandas as pd

from synthetic_data.run import run_generation


class RunTests(unittest.TestCase):
    def test_run_writes_excel_qa_and_four_chart_sheets(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            paths = run_generation(Path(temp_dir))
            self.assertTrue(paths.workbook_xlsx.exists())
            self.assertTrue(paths.qa_markdown.exists())
            self.assertEqual(len(paths.chart_sheet_names), 4)
            hourly = pd.read_excel(paths.workbook_xlsx, sheet_name=0)
            self.assertEqual(hourly.isna().sum().sum(), 0)
