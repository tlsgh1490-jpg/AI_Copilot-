import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = process.cwd();
const data = JSON.parse(await fs.readFile(path.join(root, "_management_work", "management_data.json"), "utf8"));
const outputPath = path.join(root, "산출물", "COG_관리기준표.xlsx");
const workbook = Workbook.create();

const titleFormat = { fill: "#1F4E78", font: { bold: true, color: "#FFFFFF", size: 14 }, horizontalAlignment: "center", verticalAlignment: "center" };
const headerFormat = { fill: "#D9EAF7", font: { bold: true, color: "#1F1F1F" }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#B7C9D6" } };
const bodyFormat = { verticalAlignment: "center", borders: { preset: "inside", style: "thin", color: "#E1E8ED" } };

function columnName(number) {
  let result = "";
  let current = number;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function addTableSheet(name, title, rows) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const headers = Object.keys(rows[0]);
  const lastCol = columnName(headers.length);
  sheet.getRange(`A1:${lastCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${lastCol}1`).format = titleFormat;
  sheet.getRange(`A1:${lastCol}1`).format.rowHeight = 26;
  sheet.getRange(`A3:${lastCol}3`).values = [headers];
  sheet.getRange(`A3:${lastCol}3`).format = headerFormat;
  const values = rows.map((row) => headers.map((header) => row[header] ?? null));
  sheet.getRange(`A4:${lastCol}${rows.length + 3}`).values = values;
  sheet.getRange(`A4:${lastCol}${rows.length + 3}`).format = bodyFormat;
  sheet.freezePanes.freezeRows(3);
  for (let index = 1; index <= headers.length; index += 1) {
    const header = headers[index - 1];
    const range = sheet.getRange(`${columnName(index)}1:${columnName(index)}${rows.length + 3}`);
    range.format.columnWidth = header.includes("규칙") || header.includes("판정") || header.includes("산정") ? 42 : 16;
  }
  return sheet;
}

const overview = workbook.worksheets.add("안내");
overview.showGridLines = false;
overview.getRange("A1:B1").merge();
overview.getRange("A1").values = [["Coke Oven Gas AI Copilot 관리기준표"]];
overview.getRange("A1:B1").format = titleFormat;
overview.getRange("A1:B1").format.rowHeight = 28;
overview.getRange(`A3:B${data.overview.length + 2}`).values = data.overview;
overview.getRange(`A3:A${data.overview.length + 2}`).format = { fill: "#D9EAF7", font: { bold: true }, borders: { preset: "all", style: "thin", color: "#B7C9D6" } };
overview.getRange(`B3:B${data.overview.length + 2}`).format = { wrapText: true, borders: { preset: "all", style: "thin", color: "#E1E8ED" } };
overview.getRange("A1:A20").format.columnWidth = 24;
overview.getRange("B1:B20").format.columnWidth = 88;
overview.freezePanes.freezeRows(2);

addTableSheet("KPI_관리기준", "KPI 관리기준 (실제 단위)", data.kpis);
addTableSheet("변수_관리기준", "변수 관리기준 (이벤트 제외 정상 데이터 기반)", data.variables);
addTableSheet("제외_이벤트", "정상범위 산정에서 제외한 이상 이벤트", data.events);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  sheet.getRange(`A1:${columnName(Math.min(used.columnCount, 12))}${Math.min(used.rowCount, 30)}`).format.wrapText = true;
}

const preview = await workbook.render({ sheetName: "KPI_관리기준", range: "A1:N12", scale: 1.2, format: "png" });
await fs.writeFile(path.join(root, "_management_work", "kpi_preview.png"), new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
