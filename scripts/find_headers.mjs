import XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILE_PATH = path.resolve('c:/HTML-prog/luximport-shop/catalog.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH, { sheetRows: 50 });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const headers = ["головна ГРУПА", "ПІД ГРУПА", "Артикул", "Штрихкод", "Повне найменування", "грамаж", "шт в ящику", "Сайт", "оптова"];

    console.log("Searching for headers in first 50 rows...");
    rows.forEach((row, i) => {
        const found = row.some(cell => typeof cell === 'string' && headers.some(h => cell.includes(h)));
        if (found) {
            console.log(`Row ${i + 1}:`, JSON.stringify(row));
        }
    });
} catch (err) {
    console.error('Error reading Excel:', err.message);
}
