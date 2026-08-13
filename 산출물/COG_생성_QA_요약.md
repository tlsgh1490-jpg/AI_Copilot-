# Coke Oven Gas 합성데이터 QA 요약

| 점검 항목 | 결과 | 상세 |
|---|---|---|
| missing_or_duplicate | PASS | hourly_rows=17544, daily_rows=731, missing=0, duplicate_timestamps=0 |
| kpi_formula | PASS | P01/P02/P03 and chemical unit-rate formulas recomputed |
| relationship_direction | PASS | gas_flow_correlation=0.745, outlet_temp_ddd_correlation=0.152 |
| scenario_lag | PASS | all configured target lags land inside abnormal phases |
| event_flow | PASS | events=5, phases={'normal': 16315, 'abnormal': 624, 'recovery': 365, 'precursor': 240} |

- 기준 기간: 2024-01-01 07:00 ~ 2026-01-01 06:00
- 조업일 집계 기준: 07:00 ~ 익일 07:00
- 데이터는 실제 원본을 복원하지 않은 가상 합성데이터입니다.