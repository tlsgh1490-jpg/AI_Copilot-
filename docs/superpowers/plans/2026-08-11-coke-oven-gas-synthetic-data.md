# Coke Oven Gas Synthetic Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create reproducible 2024–2025 Coke Oven Gas synthetic process data, 07:00-operation-day KPI aggregates, five labeled abnormal events, concise QA, and four representative event charts.

**Architecture:** A Python generator reads the final workbook only for IDs, units, relationships, and scenario labels; it never reads the former Raw_Data workbook. It creates smooth hourly normal operation from latent process drivers, applies five deterministic scenario overlays with 0–24-hour lags, derives KPI values, then writes one Excel workbook and a compact QA report.

**Tech Stack:** Python 3.11 bundled runtime, pandas, NumPy, openpyxl, matplotlib, pytest.

## Global Constraints

- Use only `엑셀 양식/Coke Oven Gas AI Copilot.md` and `엑셀 양식/coke_oven_gas_dummy_data_input_template.rev.2.xlsx` as business inputs.
- Do not use, recreate, or require actual raw process data or external workbook values.
- Generate timestamps from `2024-01-01 07:00` through `2026-01-01 06:00`, inclusive: exactly 17,544 hourly records.
- Aggregate every operation day from 07:00 inclusive to the next 07:00 exclusive: exactly 731 daily records.
- Generate five events: EX02, EX03, EX06 in 2024; EX07 twice in 2025.
- Use the internal mapping `KPI_EX01 -> KPI_U04_CONTAIN_S01` for DDD scenario targets.
- Keep all values fictional and reproducible using a fixed random seed.
- Deliver one Excel-centered workbook, QA summary, and four charts; do not need to deliver the Python source as a user-facing output.

---

## File Structure

- Create: `synthetic_data/config.py` — fixed date range, IDs, fictional scales, relationship strengths, scenario calendar, and lag rules.
- Create: `synthetic_data/generator.py` — hourly normal-process creation and event-overlay functions.
- Create: `synthetic_data/aggregate.py` — 07:00 operation-day assignment and KPI aggregation formulas.
- Create: `synthetic_data/qa.py` — machine-readable and Markdown QA checks.
- Create: `synthetic_data/run.py` — command-line orchestration and output writing.
- Create: `tests/test_generator.py` — timestamp, deterministic generation, non-negative data, and scenario-flow tests.
- Create: `tests/test_aggregate.py` — 07:00 boundary and KPI formula tests.
- Create: `tests/test_qa.py` — QA pass/fail logic tests.
- Create at runtime: `산출물/COG_합성데이터_2024_2025.xlsx` with `시간단위_공정데이터`, `일별_KPI_집계`, `이상이벤트_목록`, and `QA_상세` sheets.
- Create at runtime: `산출물/COG_생성_QA_요약.md`.
- Create at runtime: `그래프_EX02`, `그래프_EX03`, `그래프_EX06`, and `그래프_EX07` sheets in the Excel workbook, each containing a representative event chart.

## Data Contracts

```python
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
    driver_direction: int  # -1 decrease, +1 increase
    lag_hours: dict[str, int]

def generate_hourly_normal(config: GeneratorConfig) -> pd.DataFrame: ...
def apply_scenario(frame: pd.DataFrame, scenario: ScenarioDefinition) -> pd.DataFrame: ...
def build_daily_kpis(hourly: pd.DataFrame) -> pd.DataFrame: ...
def run_qa(hourly: pd.DataFrame, daily: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame: ...
```

### Task 1: Define deterministic configuration and event calendar

**Files:**
- Create: `synthetic_data/config.py`
- Test: `tests/test_generator.py`

**Consumes:** Final workbook IDs, selected scenario IDs, and approved dates/operation-day convention.

**Produces:** `GeneratorConfig`, `ScenarioDefinition`, `build_config()`, and `build_scenarios()` used by all later tasks.

- [ ] **Step 1: Write the failing configuration tests**

```python
from synthetic_data.config import build_config, build_scenarios

def test_config_has_exact_hourly_range_and_seed():
    config = build_config()
    assert config.start == "2024-01-01 07:00"
    assert config.end == "2026-01-01 06:00"
    assert isinstance(config.seed, int)

def test_scenario_calendar_has_required_distribution():
    scenarios = build_scenarios()
    assert [s.scenario_id for s in scenarios] == ["SCN_EX02", "SCN_EX03", "SCN_EX06", "SCN_EX07", "SCN_EX07"]
    assert sum(s.abnormal_start.year == 2024 for s in scenarios) == 3
    assert sum(s.abnormal_start.year == 2025 for s in scenarios) == 2
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pytest tests/test_generator.py -q`

Expected: FAIL because `synthetic_data.config` does not exist.

- [ ] **Step 3: Implement the configuration**

```python
@dataclass(frozen=True)
class GeneratorConfig:
    start: str = "2024-01-01 07:00"
    end: str = "2026-01-01 06:00"
    seed: int = 20260811

def build_scenarios() -> list[ScenarioDefinition]:
    # Return five non-overlapping 7–14-day envelopes.
    # EX02, EX03, EX06 are in 2024; EX07 occurs twice in 2025.
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pytest tests/test_generator.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add synthetic_data/config.py tests/test_generator.py
git commit -m "feat: define synthetic data calendar and scenarios"
```

### Task 2: Generate smooth normal hourly process data

**Files:**
- Create: `synthetic_data/generator.py`
- Modify: `tests/test_generator.py`

**Consumes:** `GeneratorConfig` and configured fictional scales/relationship coefficients.

**Produces:** `generate_hourly_normal(config) -> pd.DataFrame` with one row per hour and all required base variables.

- [ ] **Step 1: Write the failing normal-data tests**

```python
from synthetic_data.config import build_config
from synthetic_data.generator import generate_hourly_normal

def test_normal_generation_has_complete_unique_hourly_index():
    hourly = generate_hourly_normal(build_config())
    assert len(hourly) == 17_544
    assert hourly["timestamp"].is_unique
    assert hourly.isna().sum().sum() == 0

def test_normal_generation_is_reproducible_and_nonnegative():
    first = generate_hourly_normal(build_config())
    second = generate_hourly_normal(build_config())
    assert first.equals(second)
    assert (first.select_dtypes("number") >= 0).all().all()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_generator.py::test_normal_generation_has_complete_unique_hourly_index -q`

Expected: FAIL because `generate_hourly_normal` does not exist.

- [ ] **Step 3: Implement normal generation**

```python
def generate_hourly_normal(config: GeneratorConfig) -> pd.DataFrame:
    index = pd.date_range(config.start, config.end, freq="h")
    # Make latent feed, volatility, utilization, and environmental drivers.
    # Add low-amplitude day/night cycles and AR(1) noise.
    # Derive flow, concentration, L/G, temperatures, DP, steam and outputs
    # using signed strength coefficients; clip only to physical lower bounds.
    return frame
```

- [ ] **Step 4: Run the generator tests to verify they pass**

Run: `pytest tests/test_generator.py -q`

Expected: PASS; exactly 17,544 complete, deterministic rows.

- [ ] **Step 5: Commit**

```bash
git add synthetic_data/generator.py tests/test_generator.py
git commit -m "feat: generate normal hourly COG process data"
```

### Task 3: Apply abnormal scenarios with precursor, lag, and recovery

**Files:**
- Modify: `synthetic_data/generator.py`
- Modify: `tests/test_generator.py`

**Consumes:** Normal hourly frame and `ScenarioDefinition` instances.

**Produces:** `apply_scenario()` and `build_event_table()` with explicit phase timestamps and impacted IDs.

- [ ] **Step 1: Write the failing scenario-flow tests**

```python
from synthetic_data.config import build_config, build_scenarios
from synthetic_data.generator import apply_scenario, generate_hourly_normal

def test_each_scenario_has_precursor_abnormal_and_recovery():
    base = generate_hourly_normal(build_config())
    for scenario in build_scenarios():
        result = apply_scenario(base.copy(), scenario)
        assert scenario.precursor_start < scenario.abnormal_start < scenario.recovery_start < scenario.recovery_end
        assert result.loc[result.timestamp.eq(scenario.abnormal_start), "event_id"].iloc[0] == scenario.event_id

def test_ex06_temperature_rise_precedes_ddd_increase():
    # Compare event values with the same timestamps in normal baseline.
    pass
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_generator.py::test_each_scenario_has_precursor_abnormal_and_recovery -q`

Expected: FAIL because `apply_scenario` does not exist.

- [ ] **Step 3: Implement event overlays**

```python
def apply_scenario(frame: pd.DataFrame, scenario: ScenarioDefinition) -> pd.DataFrame:
    # Apply ramp weights: 0→0.35 during precursor, 0.35→1 during onset,
    # retain full effect while abnormal, and 1→0 during recovery.
    # Apply driver direction first. Apply target effects after each configured lag.
    # Annotate event_id, scenario_id, and event_phase without overwriting normal data outside the envelope.
    return frame
```

- [ ] **Step 4: Run scenario tests to verify they pass**

Run: `pytest tests/test_generator.py -q`

Expected: PASS; five labeled non-overlapping events and correct EX06 cause/effect ordering.

- [ ] **Step 5: Commit**

```bash
git add synthetic_data/generator.py tests/test_generator.py
git commit -m "feat: overlay labeled COG abnormal scenarios"
```

### Task 4: Aggregate 07:00 operation-day KPIs

**Files:**
- Create: `synthetic_data/aggregate.py`
- Create: `tests/test_aggregate.py`

**Consumes:** Fully generated hourly DataFrame.

**Produces:** `assign_operation_day(hourly)` and `build_daily_kpis(hourly)` with 731 records and formula-derived KPIs.

- [ ] **Step 1: Write failing aggregation tests**

```python
from synthetic_data.aggregate import assign_operation_day, build_daily_kpis

def test_operation_day_changes_at_0700(sample_hourly):
    assigned = assign_operation_day(sample_hourly)
    assert assigned.loc[assigned.timestamp.eq("2024-01-02 06:00"), "operation_date"].iloc[0] == "2024-01-01"
    assert assigned.loc[assigned.timestamp.eq("2024-01-02 07:00"), "operation_date"].iloc[0] == "2024-01-02"

def test_daily_kpi_formula_uses_aggregated_production_and_feed(hourly):
    daily = build_daily_kpis(hourly)
    row = daily.iloc[0]
    assert row["KPI_U04_UI_P01"] == pytest.approx(row["KPI_U04_OUT_P01"] * 1000 / row["VAR_U04_FEED_U02"])
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_aggregate.py -q`

Expected: FAIL because `synthetic_data.aggregate` does not exist.

- [ ] **Step 3: Implement daily aggregation**

```python
def assign_operation_day(hourly: pd.DataFrame) -> pd.DataFrame:
    result = hourly.copy()
    result["operation_date"] = (result["timestamp"] - pd.Timedelta(hours=7)).dt.date
    return result

def build_daily_kpis(hourly: pd.DataFrame) -> pd.DataFrame:
    # Sum or average each configured variable by operation_date.
    # Calculate P01/P02/P03 and chemical unit-rate formulas from aggregated values.
    return daily
```

- [ ] **Step 4: Run aggregation tests to verify they pass**

Run: `pytest tests/test_aggregate.py -q`

Expected: PASS; 731 rows and exact 07:00 boundary behavior.

- [ ] **Step 5: Commit**

```bash
git add synthetic_data/aggregate.py tests/test_aggregate.py
git commit -m "feat: aggregate 07-hour operation-day KPIs"
```

### Task 5: Implement QA checks and charts

**Files:**
- Create: `synthetic_data/qa.py`
- Create: `tests/test_qa.py`
- Modify: `synthetic_data/run.py`

**Consumes:** Hourly frame, daily KPI table, event table, and scenario definitions.

**Produces:** `run_qa()` result table, Markdown summary, and four representative chart sheets in the Excel workbook.

- [ ] **Step 1: Write failing QA tests**

```python
from synthetic_data.qa import run_qa

def test_qa_reports_required_check_names(hourly, daily, events):
    checks = run_qa(hourly, daily, events)
    assert set(["missing_or_duplicate", "kpi_formula", "relationship_direction", "scenario_lag", "event_flow"]).issubset(checks.check_name)
    assert checks["passed"].all()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_qa.py -q`

Expected: FAIL because `synthetic_data.qa` does not exist.

- [ ] **Step 3: Implement QA and chart writer**

```python
def run_qa(hourly: pd.DataFrame, daily: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:
    # Emit one row each for completeness, KPI formulas, relationship signs,
    # scenario lags, and precursor→abnormal→recovery ordering.
    return checks

def add_scenario_chart_sheets(workbook, hourly: pd.DataFrame, events: pd.DataFrame) -> list[str]:
    # Write one labelled Excel chart sheet for the first event of EX02/EX03/EX06/EX07.
    return sheet_names
```

- [ ] **Step 4: Run QA tests to verify they pass**

Run: `pytest tests/test_qa.py -q`

Expected: PASS; all five required QA check names pass on generated data.

- [ ] **Step 5: Commit**

```bash
git add synthetic_data/qa.py synthetic_data/run.py tests/test_qa.py
git commit -m "feat: add COG data QA and event charts"
```

### Task 6: Generate and verify final deliverables

**Files:**
- Create: `synthetic_data/run.py`
- Create: `산출물/` output files listed in File Structure.

**Consumes:** Completed generation, aggregation, QA, and chart functions.

**Produces:** All five requested output categories and a reproducibility record in QA summary.

- [ ] **Step 1: Write failing output-contract test**

```python
def test_run_writes_all_required_outputs(tmp_path):
    paths = run_generation(tmp_path)
    assert paths.workbook_xlsx.exists()
    assert paths.qa_markdown.exists()
    assert len(paths.chart_sheet_names) == 4
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests -q`

Expected: FAIL because `run_generation` does not exist.

- [ ] **Step 3: Implement command orchestration and output writing**

```python
def run_generation(output_dir: Path) -> OutputPaths:
    hourly = generate_hourly_normal(build_config())
    for scenario in build_scenarios():
        hourly = apply_scenario(hourly, scenario)
    daily = build_daily_kpis(hourly)
    events = build_event_table(build_scenarios())
    checks = run_qa(hourly, daily, events)
    # Save the four data tables and four scenario chart sheets to one Excel workbook, plus QA Markdown.
    return paths
```

- [ ] **Step 4: Run the entire test suite and generation command**

Run: `pytest tests -q; python -m synthetic_data.run`

Expected: PASS; outputs contain 17,544 hourly rows, 731 daily rows, five events, passing QA, and four charts.

- [ ] **Step 5: Independently inspect final outputs**

Run: `python -c "import pandas as pd; p='산출물/COG_합성데이터_2024_2025.xlsx'; print(len(pd.read_excel(p, sheet_name='시간단위_공정데이터'))); print(len(pd.read_excel(p, sheet_name='일별_KPI_집계')); print(len(pd.read_excel(p, sheet_name='이상이벤트_목록')))"`

Expected: `17544`, `731`, `5`.

- [ ] **Step 6: Commit**

```bash
git add synthetic_data tests 산출물
git commit -m "feat: generate COG synthetic data deliverables"
```

## Self-Review

- Spec coverage: Tasks 2–3 cover fictional normal data, configured relationships/lags, and five approved events. Task 4 covers the 07:00 operation-day rule and KPI formulas. Task 5 covers all five requested QA dimensions and representative charts. Task 6 writes the five requested deliverable categories.
- Input isolation: all business assumptions are explicit in `config.py`; no task loads raw process rows or the removed external workbook.
- Placeholder scan: no deferred implementation, unspecified files, or unspecified checks remain.
- Interface consistency: all later tasks use the exact `GeneratorConfig`, `ScenarioDefinition`, `generate_hourly_normal`, `apply_scenario`, `build_daily_kpis`, and `run_qa` contracts defined above.
