import XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILE_PATH = path.resolve('c:/HTML-prog/luximport-shop/catalog.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("Searching for 'ГРУПА' in the whole sheet...");
    let found = false;
    rows.forEach((row, i) => {
        if (!row) return;
        const groupCols = [];
        row.forEach((cell, j) => {
            if (typeof cell === 'string' && cell.includes('ГРУПА')) {
                groupCols.push({ col: j, val: cell });
            }
        });
        if (groupCols.length > 0) {
            console.log(`Row ${i + 1} contains 'ГРУПА' at columns:`, groupCols);
            found = true;
        }
    });

    if (!found) {
        console.log("Could not find 'ГРУПА' in any row.");
        // Maybe check column letters/indexes directly if the user gave us a hint?
        // Let's print the first row that actually has many columns to see the "width"
        const widestRow = rows.reduce((max, row) => row.length > max ? row.length : max, 0);
        console.log("Maximum columns found in any row:", widestRow);
    }
} catch (err) {
    console.error('Error reading Excel:', err.message);
}
