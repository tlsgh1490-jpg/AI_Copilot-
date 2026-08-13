import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.cwd();
const data = JSON.parse(await fs.readFile(path.join(root, "_cost_work", "cost_data.json"), "utf8"));
const target = path.join(root, "산출물", "COG_합성데이터_2024_2025.xlsx");
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(target));

const titleFormat = { fill: "#1F4E78", font: { bold: true, color: "#FFFFFF", size: 14 }, horizontalAlignment: "center", verticalAlignment: "center" };
const headerFormat = { fill: "#D9EAF7", font: { bold: true }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#B7C9D6" } };

function col(n) { let s = ""; for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s; return s; }
function addSheet(name, title, rows) {
  const old = workbook.worksheets.getItemOrNullObject(name);
  if (!old.isNullObject) old.delete();
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const headers = Object.keys(rows[0]);
  const last = col(headers.length);
  sheet.getRange(`A1:${last}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${last}1`).format = titleFormat;
  sheet.getRange(`A3:${last}3`).values = [headers];
  sheet.getRange(`A3:${last}3`).format = headerFormat;
  sheet.getRange(`A4:${last}${rows.length + 3}`).values = rows.map((row) => headers.map((h) => row[h] ?? null));
  sheet.freezePanes.freezeRows(3);
  for (let i = 1; i <= headers.length; i += 1) sheet.getRange(`${col(i)}:${col(i)}`).format.columnWidth = headers[i - 1].includes("산식") || headers[i - 1].includes("판정") ? 34 : 18;
  return sheet;
}

const formulaRows = data.formula.map((row) => ({ "원가항목": row[0], "계산산식": row[1], "손익해석": row[2], "비고": "교육용 가상 단가 적용" }));
addSheet("원가_산식", "원가 영향 산식", formulaRows);
addSheet("원가_단가설정", "가상 단가 설정 (연/분기 변경)", data.prices);
addSheet("월별_원가영향", "월별 원가 영향", data.monthly);
addSheet("이벤트별_원가영향", "이벤트별 원가 영향", data.events);

const preview = await workbook.render({ sheetName: "월별_원가영향", range: "A1:J18", scale: 1, format: "png" });
await fs.writeFile(path.join(root, "_cost_work", "cost_preview.png"), new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(target);
console.log(target);
