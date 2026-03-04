import { NextResponse } from "next/server";
import { extractTextFromPDF, parseBankStatementData, generateTxtReport } from "@/lib/pdf-parser";
import { uploadPDF } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Local storage directory for TXTs (PDFs now go to Supabase)
const STORAGE_DIR = path.join(process.cwd(), "storage");

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("pdf") as File | null;
        const expedienteId = (formData.get("expedienteId") as string | null) ?? "sin-asignar";

        if (!file) {
            return NextResponse.json({ error: "No se encontró ningún archivo PDF" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "El archivo excede el tamaño máximo (20MB)" }, { status: 400 });
        }

        await fs.mkdir(STORAGE_DIR, { recursive: true });

        const docId = uuidv4().substring(0, 8).toUpperCase();
        const originalName = file.name;
        const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Upload PDF to Supabase Storage
        const { url: storageUrl, size } = await uploadPDF(buffer, expedienteId, docId, originalName);

        // 2. Extract Text
        const extractedText = await extractTextFromPDF(buffer);

        // 3. Parse Data
        const parsedData = parseBankStatementData(extractedText);

        // 4. Generate TXT Report (local backup)
        const txtContent = generateTxtReport(originalName, parsedData, docId);
        const txtPath = path.join(STORAGE_DIR, `${docId}_${safeName}.txt`);
        await fs.writeFile(txtPath, txtContent);

        return NextResponse.json({
            success: true,
            caseId: docId,
            originalName,
            storageUrl,
            size,
            data: parsedData,
            txtContent,
            txtFilename: `${docId}_${safeName}.txt`,
        });

    } catch (error: any) {
        console.error("Error processing PDF:", error);
        return NextResponse.json(
            { error: error.message || "Error interno al procesar el archivo" },
            { status: 500 }
        );
    }
}
