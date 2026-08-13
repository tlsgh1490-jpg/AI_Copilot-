import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
const root=process.cwd(); const data=JSON.parse(await fs.readFile(path.join(root,"_analysis_work","analysis_data.json"),"utf8")); const target=path.join(root,"산출물","COG_분석결과.xlsx"); const wb=Workbook.create();
const title={fill:"#1F4E78",font:{bold:true,color:"#FFFFFF",size:14},horizontalAlignment:"center"}; const header={fill:"#D9EAF7",font:{bold:true},horizontalAlignment:"center",wrapText:true};
function col(n){let s="";for(let x=n;x>0;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s}
function add(name,titleText,rows){const old=wb.worksheets.getItemOrNullObject(name);if(!old.isNullObject)old.delete();const sh=wb.worksheets.add(name);const hs=Object.keys(rows[0]);const last=col(hs.length);sh.getRange(`A1:${last}1`).merge();sh.getRange("A1").values=[[titleText]];sh.getRange(`A1:${last}1`).format=title;sh.getRange(`A3:${last}3`).values=[hs];sh.getRange(`A3:${last}3`).format=header;sh.getRange(`A4:${last}${rows.length+3}`).values=rows.map(r=>hs.map(h=>r[h]??null));sh.freezePanes.freezeRows(3);return sh}
add("일별_KPI_상태","일별 KPI 상태 (2일 연속 판정)",data.daily_status); add("이상_분석결과","이상 이벤트 분석 결과",data.event_analysis); add("분석_판정규칙","분석 판정 규칙",data.rules.map(r=>({"구분":r[0],"규칙":r[1]})));
const out=await SpreadsheetFile.exportXlsx(wb);await out.save(target);console.log(target);
