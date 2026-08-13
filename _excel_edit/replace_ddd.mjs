import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.cwd();
const targets = [
  path.join(root, "엑셀 양식", "coke_oven_gas_dummy_data_input_template.rev.2.xlsx"),
  path.join(root, "산출물", "COG_합성데이터_2024_2025.xlsx"),
];
const outputDir = path.join(root, "_excel_edit", "edited");
await fs.mkdir(outputDir, { recursive: true });

for (const target of targets) {
  const input = await FileBlob.load(target);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const before = await workbook.inspect({
    kind: "match",
    searchTerm: "DDD",
    options: { useRegex: false, maxResults: 100 },
    summary: "DDD labels before replacement",
  });
  console.log(path.basename(target), before.ndjson);

  for (const sheet of workbook.worksheets.items) {
    const used = sheet.getUsedRange();
    const values = used.values;
    for (let row = 0; row < values.length; row += 1) {
      for (let col = 0; col < values[row].length; col += 1) {
        const value = values[row][col];
        if (typeof value === "string" && value.includes("DDD")) {
          sheet.getCell(row, col).values = [[value.replaceAll("DDD", "품질함량")]];
        }
      }
    }
  }

  const after = await workbook.inspect({
    kind: "match",
    searchTerm: "DDD",
    options: { useRegex: false, maxResults: 100 },
    summary: "DDD labels after replacement",
  });
  console.log(path.basename(target), after.ndjson);
  const preview = await workbook.render({ sheetName: workbook.worksheets.getItemAt(0).name, range: "A1:H30", scale: 1, format: "png" });
  const stem = path.basename(target, ".xlsx");
  await fs.writeFile(path.join(outputDir, `${stem}.png`), new Uint8Array(await preview.arrayBuffer()));
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outputDir, path.basename(target)));
}
