/**
 * debug-excel.mjs — Prints the first 10 rows of catalog.xlsx
 * Run: node scripts/debug-excel.mjs
 */
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '../catalog.xlsx');

const workbook = XLSX.readFile(FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log(`Sheet: "${workbook.SheetNames[0]}"  —  ${rows.length} total rows\n`);
const preview = rows.slice(0, 10);
preview.forEach((row, i) => {
  console.log(`Row ${i + 1}:`, JSON.stringify(row));
});
