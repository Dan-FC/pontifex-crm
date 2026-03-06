import { NextResponse } from "next/server";
import { extractTextFromFinancialPDF, parseFinancialStatement } from "@/lib/financial-statement-parser";

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
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "El archivo excede el tamaño máximo (20MB)" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await extractTextFromFinancialPDF(buffer);

        // ── DEBUG: imprime el texto crudo para diagnosticar el formato del PDF ──
        console.log("=== RAW PDF TEXT (primeras 3000 chars) ===");
        console.log(text.substring(0, 3000));
        console.log("=== FIN RAW TEXT ===");

        const result = parseFinancialStatement(text);

        // ── DEBUG: imprime los valores parseados ──
        console.log("=== PARSED FIELDS ===");
        console.log("Balance General:", JSON.stringify(result.balanceGeneral, null, 2));
        console.log("Estado Resultados:", JSON.stringify(result.estadoResultados, null, 2));
        console.log("Periodos:", result.periodos);
        console.log("=== FIN PARSED ===");

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Error processing financial statement:", error);
        return NextResponse.json(
            { error: error.message || "Error interno al procesar el estado financiero" },
            { status: 500 }
        );
    }
}
