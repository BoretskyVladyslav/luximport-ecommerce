import XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILE_PATH = path.resolve('c:/HTML-prog/luximport-shop/catalog.xlsx');

try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    console.log("Sheets:", workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 }); // Start from the beginning

        // Look for headers in the first 20 rows of each sheet
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const hasGroup = row.some(cell => typeof cell === 'string' && (cell.includes('ГРУПА') || cell.includes('Артикул')));
            if (hasGroup) {
                console.log(`Row ${i + 1}:`, JSON.stringify(row));
            }
        }
    });
} catch (err) {
    console.error('Error reading Excel:', err.message);
}
