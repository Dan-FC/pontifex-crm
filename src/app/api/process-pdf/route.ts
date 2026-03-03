import { NextResponse } from "next/server";
import { extractTextFromPDF, parseBankStatementData, generateTxtReport } from "@/lib/pdf-parser";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Local storage directory for PDFs and TXTs
const STORAGE_DIR = path.join(process.cwd(), "storage");

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("pdf") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se encontró ningún archivo PDF" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) { // 20MB
            return NextResponse.json({ error: "El archivo excede el tamaño máximo (20MB)" }, { status: 400 });
        }

        await fs.mkdir(STORAGE_DIR, { recursive: true });

        const caseId = uuidv4().substring(0, 8).toUpperCase();
        const originalName = file.name;
        const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");

        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfPath = path.join(STORAGE_DIR, `${caseId}_${safeName}`);
        await fs.writeFile(pdfPath, buffer);

        // 1. Extract Text
        const extractedText = await extractTextFromPDF(buffer);

        // 2. Parse Data
        const parsedData = parseBankStatementData(extractedText);

        // 3. Generate TXT Report
        const txtContent = generateTxtReport(originalName, parsedData, caseId);
        const txtPath = path.join(STORAGE_DIR, `${caseId}_${safeName}.txt`);
        await fs.writeFile(txtPath, txtContent);

        // (Phase 2) Placeholder for Excel Export
        // import { exportToExcel } from "@/lib/excel-export";
        // const excelPath = path.join(STORAGE_DIR, `${caseId}_${safeName}.xlsx`);
        // await exportToExcel(parsedData, excelPath);

        return NextResponse.json({
            success: true,
            caseId,
            originalName,
            data: parsedData,
            txtContent,
            txtFilename: `${caseId}_${safeName}.txt`,
        });

    } catch (error: any) {
        console.error("Error processing PDF:", error);
        return NextResponse.json(
            { error: error.message || "Error interno al procesar el archivo" },
            { status: 500 }
        );
    }
}
