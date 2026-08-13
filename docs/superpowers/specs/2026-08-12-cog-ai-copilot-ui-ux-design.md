# Coke Oven Gas AI Copilot UI/UX Design

## Purpose

Design a desktop web dashboard for a presentation and internal demonstration of the Coke Oven Gas AI Copilot. It uses the existing synthetic data, analysis CSVs, cost-impact outputs, and management-standard table, while remaining extensible to future live data.

## Information Architecture

The left navigation contains only three top-level items:

1. **통합 현황**: consolidated operational overview and entry point to Brief & Copilot, 이상 진단, and 원가 영향.
2. **공정 데이터 분석**: selected KPI/process-variable analysis and arbitrary-period comparison.
3. **기준 체계**: management standards, decision rules, and versioned standard history.

## Global Rules

- Target: desktop dashboard at 1440px width.
- Always show the data-as-of timestamp and a synthetic-data badge.
- Date/time ranges are never artificially limited. Users can select arbitrary start and end datetimes.
- Quick ranges (previous day, month, same month last year, quarter, same quarter last year) are convenience controls only.
- Use visualizations only where they support quick judgment: status colors with text/icons, sparklines, trend charts, range bands, event markers, contribution charts, and timelines.
- State that any root-cause wording is an expected cause/check candidate, not a confirmed cause.

## 통합 현황

Goal: let an engineer or manager assess operational state in about 30 seconds and enter a detailed analysis.

- Header: application title, as-of timestamp, synthetic-data badge, base date, analysis period, refresh action.
- Summary cards: normal KPI count, warning KPI count, abnormal KPI count, selected-period cost impact.
- KPI status cards and the detailed status table must identify the affected KPI, current value, management threshold/range, target comparison, and amount of warning or abnormal deviation; counts alone are insufficient.
- KPI trend visuals must match the metric type and visibly label their management range, limit, or target baseline. Use a dotted reference line for a threshold where a chart is shown.
- Cost summaries must show the related actual consumption or production quantity and its target comparison alongside financial impact.
- Brief & Copilot summary card/link, highest-priority abnormal-event card/link, cost-impact summary/link, and selected-KPI trend link.
- Cards link to the corresponding detailed view while preserving selected period and event context.

## Brief & Copilot

The page is vertically structured, with Brief first and Copilot below it.

### Brief

- A 2-3 sentence report-ready operating summary.
- State the highest-priority issue and recommended first check.
- Show normal/warning/abnormal KPI counts and selected-period cost impact.
- Show three issue-relevant KPI rows only, each with status, change, and small sparkline.
- For an abnormal or warning KPI, include its current value, threshold, and deviation in the row or its adjacent supporting detail.
- Link to 공정 데이터 분석 for full KPI detail.

### Copilot

- No LLM is required for the MVP. Use selected issue/event/KPI/period context, existing output data, and deterministic templates.
- User selects a topic chip such as an event, KPI change, or cost impact.
- Show sections in this fixed order: 핵심 이슈, 결론, 확인 근거, 권장 점검, detailed-analysis links.
- Offer only supported suggestion questions initially. Future LLM integration may add free-form questions.
- Detailed links preserve the current event and period context.

## 이상 진단

Goal: diagnose a selected abnormal event and show what to check first.

- Event selector lists EX02, EX03, EX06, and both dated EX07 occurrences.
- Show event title, affected KPI, expected causes/check candidates, priority, and link to cost impact.
- Do not show a separate precursor -> abnormal -> recovery timeline.
- Show selected impact KPI and 2-3 driver-variable trend charts with normal bands and warning/abnormal intervals. Present event dates and phase-related evidence as concise text in the event summary and evidence cards.
- Show evidence, expected cause/check candidates, and prioritized recommended checks.
- Evidence and trend charts identify the applicable management threshold, actual value, and deviation, not only the direction of change.
- Keep the non-confirmed-cause disclaimer visible.

## 원가 영향

Goal: turn operational change into financial impact.

- Arbitrary date/time range and event selector.
- Summary cards for total, gas, chemical, and steam cost impact; clarify negative is loss and positive is improvement.
- Add actual quantity, target quantity, and target variance for gas, chemical, and steam so users can connect financial impact to operational usage.
- Trend visualization with day/month/quarter aggregation, plus gas/chemical/steam contribution visualization.
- Event cost-impact table linking each row to 이상 진단.
- Expandable formula and unit-rate panel:
  - Gas: `(actual gas - target gas) × (base gas unit price × 30%)`.
  - Chemical: `(target use - actual use) × chemical unit price`.
  - Steam: `(target use - actual use) × steam unit price`.
  - Gas and chemical rates vary yearly; steam rates vary quarterly.

## 공정 데이터 분석

Keep the page intentionally simple with only three ordered sections.

1. **분석 지표 선택**: multi-select KPI and process variables; selected items appear as removable chips.
2. **기간 비교**: independently select arbitrary base and comparison datetime ranges; provide quick-comparison buttons without restricting manual selection. Use calendar-ready datetime controls; actual date-picker data binding is deferred to the backend phase.
3. **분석 결과**: table of selected items with base-period value, comparison-period value, absolute difference, percentage/point difference, and direction. A user may expand per-selected-item comparison visualizations and request a deterministic analysis summary.

For unequal periods, show cumulative measures with both total and daily average. Show ratio, quality, and temperature measures with average, minimum, maximum, and variation. Only user-selected items appear in charts; no KPI is fixed by default. Optional charts show normal ranges and event markers.

## 기준 체계

- Search/filter KPI and process-variable management standards.
- Table: category, item, normal range, warning threshold, abnormal threshold.
- Display decision rules: hourly process variables become abnormal after three continuous out-of-range hours; daily KPIs become abnormal after two continuous out-of-range days; warning is an out-of-range candidate before the continuity condition is met.
- Visualize normal -> warning -> abnormal status flow.
- Admin-only standard-change flow captures changed item, before/after values, effective start datetime, reason, and changer.
- Maintain immutable versioned history with version, effective start, item, change content, reason, changer, and changed timestamp.
- New standards apply to data on/after their effective datetime. Historical records retain the standard version used at the time. Reanalysis under a new standard is an explicit administrator action.

## Integration and Data

- Use existing synthetic data and analysis outputs as the MVP source.
- Existing sources include the integrated COG workbook, daily KPI status, abnormal analysis results, decision rules, and management-standard workbook.
- The presentation UI must label data as synthetic.
- Future live-data integration replaces or adds a data source without changing page structure.
