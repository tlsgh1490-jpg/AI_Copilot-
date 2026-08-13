import pandas as pd


SUM_COLUMNS = {
    "KPI_U04_QTY_G01",
    "VAR_U04_FEED_U02",
    "KPI_U04_OUT_P01",
    "KPI_U04_OUT_P02",
    "KPI_U04_OUT_P03",
    "KPI_U04_CHEM_M01",
    "KPI_U04_CHEM_M02",
}


def assign_operation_day(hourly: pd.DataFrame) -> pd.DataFrame:
    result = hourly.copy()
    result["operation_date"] = (result["timestamp"] - pd.Timedelta(hours=7)).dt.strftime("%Y-%m-%d")
    return result


def build_daily_kpis(hourly: pd.DataFrame) -> pd.DataFrame:
    assigned = assign_operation_day(hourly)
    numeric_columns = assigned.select_dtypes("number").columns.tolist()
    aggregation = {column: ("sum" if column in SUM_COLUMNS else "mean") for column in numeric_columns}
    daily = assigned.groupby("operation_date", as_index=False).agg(aggregation)

    daily["KPI_U04_UI_P01"] = daily["KPI_U04_OUT_P01"] * 1000 / daily["VAR_U04_FEED_U02"]
    daily["KPI_U04_UI_P02"] = daily["KPI_U04_OUT_P02"] * 1000 / daily["VAR_U04_FEED_U02"]
    daily["KPI_U04_UI_P03"] = daily["KPI_U04_OUT_P03"] * 1000 / daily["VAR_U04_FEED_U02"]
    daily["KPI_U04_CHEM_U01"] = daily["KPI_U04_CHEM_M01"] * 1000 / daily["KPI_U04_QTY_G01"]
    daily["KPI_U04_CHEM_U02"] = daily["KPI_U04_CHEM_M02"] * 1000 / daily["KPI_U04_QTY_G01"]
    return daily
