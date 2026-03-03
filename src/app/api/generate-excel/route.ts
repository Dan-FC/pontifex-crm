import { NextResponse } from "next/server";
import { generateExcelFromTemplate } from "@/lib/excel-populate";
import fs from "fs/promises";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { caseId, año, mes, saldoAnterior, saldoFinal } = body;

        // Validate required fields
        if (!caseId || !año || !mes) {
            return NextResponse.json({ error: "Faltan parámetros: caseId, año y mes son requeridos." }, { status: 400 });
        }

        if (saldoAnterior === undefined || saldoAnterior === null || saldoAnterior === "" ||
            saldoFinal === undefined || saldoFinal === null || saldoFinal === "") {
            return NextResponse.json({ error: "No se detectó saldo anterior/final. Revisa el PDF procesado." }, { status: 400 });
        }

        const saldoAntNum = parseFloat(String(saldoAnterior).replace(/,/g, ""));
        const saldoFinNum = parseFloat(String(saldoFinal).replace(/,/g, ""));

        if (isNaN(saldoAntNum) || isNaN(saldoFinNum)) {
            return NextResponse.json({ error: "Los valores de saldo no son números válidos." }, { status: 400 });
        }

        const result = await generateExcelFromTemplate(
            caseId,
            Number(año),
            String(mes),
            saldoAntNum,
            saldoFinNum
        );

        return NextResponse.json({
            success: true,
            filename: result.filename,
            rowFilled: result.rowFilled,
            cellD: result.cellD,
            cellE: result.cellE,
        });
    } catch (error: any) {
        console.error("Error generating Excel:", error);
        return NextResponse.json(
            { error: error.message || "Error interno al generar el Excel." },
            { status: 500 }
        );
    }
}

// Endpoint to download the generated Excel file by filename
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get("file");
        if (!filename || filename.includes("..")) {
            return NextResponse.json({ error: "Nombre de archivo inválido." }, { status: 400 });
        }

        const path = require("path");
        const filePath = path.join(process.cwd(), "exports", filename);

        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
    }
}
