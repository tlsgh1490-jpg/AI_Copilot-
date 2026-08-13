import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.cwd();
const target = path.join(root, "산출물", "COG_관리기준표.xlsx");
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "management workbook formula error scan",
});
console.log(errors.ndjson);
const ranges = {
  "안내": "A1:B9",
  "KPI_관리기준": "A1:N11",
  "변수_관리기준": "A1:L23",
  "제외_이벤트": "A1:I8",
};
for (const [sheetName, range] of Object.entries(ranges)) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(root, "_management_work", `verify_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
  console.log(`RENDERED=${sheetName}`);
}
