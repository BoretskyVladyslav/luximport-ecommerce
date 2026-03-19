import XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILE_PATH = path.resolve('c:/HTML-prog/luximport-shop/catalog.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '(empty)' });

    console.log("Sheet structure (first 50 rows):");
    rows.slice(0, 50).forEach((row, i) => {
        // Only print rows that have more than 5 non-empty columns to find header or data rows
        const nonEmptyCount = row.filter(c => c !== '(empty)' && c !== null).length;
        if (nonEmptyCount > 5) {
            console.log(`Row ${i + 1}:`, JSON.stringify(row));
        }
    });
} catch (err) {
    console.error('Error reading Excel:', err.message);
}
