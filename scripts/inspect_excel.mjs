import XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILE_PATH = path.resolve('c:/HTML-prog/luximport-shop/catalog.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH, { sheetRows: 10 }); // Read more rows to catch headers
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(JSON.stringify(rows, null, 2));
} catch (err) {
    console.error('Error reading Excel:', err.message);
}
