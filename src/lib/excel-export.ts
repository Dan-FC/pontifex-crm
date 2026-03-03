import * as ExcelJS from "exceljs";
import { ParsedBankStatement } from "./pdf-parser";
import path from "path";

/**
 * Placeholder for Phase 2: Excel Export
 * Takes the extracted statement data, loads a template, 
 * populates specific cells, and saves it.
 */
export async function exportToExcel(result: ParsedBankStatement, destinationPath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // NOTE: In Phase 2, we will use workbook.xlsx.readFile(templatePath)
    // For now, we just create a new worksheet to demonstrate mapping.
    const sheet = workbook.addWorksheet('Resumen de Cuenta');

    // --- CELL MAPPING PLACEHOLDERS ---

    // Title
    sheet.getCell('A1').value = "Resumen de Estado de Cuenta (Nexus Pontifex)";
    sheet.getCell('A1').font = { bold: true, size: 14 };

    // Totals Mapping
    sheet.getCell('A4').value = "Ingresos Totales:";
    sheet.getCell('B4').value = parseFloat(result.ingresos_totales.replace(/,/g, ''));
    sheet.getCell('B4').numFmt = '"$"#,##0.00';

    sheet.getCell('A5').value = "Egresos Totales:";
    sheet.getCell('B5').value = parseFloat(result.egresos_totales.replace(/,/g, ''));
    sheet.getCell('B5').numFmt = '"$"#,##0.00';

    // Movements Table Header (Mapping starting at row 8)
    sheet.getCell('A8').value = "FECHA";
    sheet.getCell('B8').value = "DESCRIPCION";
    sheet.getCell('C8').value = "TIPO";
    sheet.getCell('D8').value = "MONTO";

    ['A8', 'B8', 'C8', 'D8'].forEach(cell => {
        sheet.getCell(cell).font = { bold: true };
        sheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // Populate Movements (A9:D...)
    let currentRow = 9;
    for (const mov of result.movimientos) {
        sheet.getCell(`A${currentRow}`).value = mov.fecha;
        sheet.getCell(`B${currentRow}`).value = mov.descripcion;
        sheet.getCell(`C${currentRow}`).value = mov.tipo;

        sheet.getCell(`D${currentRow}`).value = parseFloat(mov.monto.replace(/,/g, ''));
        sheet.getCell(`D${currentRow}`).numFmt = '"$"#,##0.00';

        currentRow++;
    }

    // Adjust column widths
    sheet.getColumn('A').width = 15;
    sheet.getColumn('B').width = 40;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 20;

    // Save Excel file to local storage or bucket
    await workbook.xlsx.writeFile(destinationPath);
    console.log(`Excel guardado exitosamente en: ${destinationPath}`);
}

