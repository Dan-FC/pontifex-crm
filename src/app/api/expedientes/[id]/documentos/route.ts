import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularCompletitud } from "@/lib/completitud";
import { uploadPDF, uploadJSON } from "@/lib/supabase";
import { extractTextFromFinancialPDF, parseFinancialStatement } from "@/lib/financial-statement-parser";
import { extractTextFromPDF, parseBankStatementData, generateTxtReport } from "@/lib/pdf-parser";
import path from "path";
import fs from "fs/promises";

const STORAGE_DIR = path.join(process.cwd(), "storage");

// ── POST /api/expedientes/[id]/documentos ────────────────────────────────────
// Recibe un PDF via FormData, lo sube a Supabase Storage, corre OCR si aplica,
// guarda el resultado en DB y en Supabase Storage (JSON). No recalcula si ya
// existe datosExtraidos en el registro.
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: expedienteId } = await params;
    try {
        const contentType = request.headers.get("content-type") ?? "";
        let tipo = "";
        let nombre = "";
        let estatus = "Entregado";
        let fileUrl: string | undefined;
        let fileSize: number | undefined;
        let datosExtraidos: string | undefined;
        let buffer: Buffer | undefined;
        let originalName = "";
        let ocrData: any = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("pdf") as File | null;
            tipo = (formData.get("docId") as string) ?? (formData.get("tipo") as string) ?? "";
            nombre = (formData.get("nombre") as string) ?? (file?.name ?? "");
            estatus = (formData.get("estatus") as string) ?? "Entregado";
            // datosExtraidos puede venir del cliente (legacy) o lo calculamos aquí
            const clientDatos = formData.get("datosExtraidos") as string | null;

            if (!tipo || !nombre) {
                return NextResponse.json(
                    { error: "Se requieren 'docId' y 'nombre' en el FormData." },
                    { status: 400 }
                );
            }

            if (file && file.size > 0) {
                buffer = Buffer.from(await file.arrayBuffer());
                originalName = file.name;

                // 1. Subir PDF a Supabase Storage
                const result = await uploadPDF(buffer, expedienteId, tipo, file.name);
                fileUrl = result.url;
                fileSize = result.size;

                // 2. OCR según tipo de documento (si no viene ya del cliente)
                if (!clientDatos) {
                    if (tipo === "estados-financieros") {
                        estatus = "Procesado";
                        const text = await extractTextFromFinancialPDF(buffer);
                        const parsed = parseFinancialStatement(text);
                        datosExtraidos = JSON.stringify(parsed);
                        ocrData = parsed;

                        // Subir JSON resultado a Supabase Storage como respaldo
                        try {
                            await uploadJSON(datosExtraidos, expedienteId, tipo);
                        } catch (e) {
                            console.warn("No se pudo subir JSON OCR a Supabase:", e);
                        }

                    } else if (tipo === "estados-cuenta-banco") {
                        estatus = "Procesado";
                        const text = await extractTextFromPDF(buffer);
                        const parsed = parseBankStatementData(text);
                        datosExtraidos = JSON.stringify(parsed);
                        ocrData = parsed;

                        // Guardar TXT local de respaldo
                        try {
                            await fs.mkdir(STORAGE_DIR, { recursive: true });
                            const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
                            const docId = tipo;
                            const txtContent = generateTxtReport(originalName, parsed, docId);
                            await fs.writeFile(
                                path.join(STORAGE_DIR, `${Date.now()}_${safeName}.txt`),
                                txtContent
                            );
                        } catch (e) {
                            console.warn("No se pudo guardar TXT local:", e);
                        }
                    }
                } else {
                    // Datos ya procesados por el cliente (legacy support)
                    datosExtraidos = clientDatos;
                    try { ocrData = JSON.parse(clientDatos); } catch { /* ignore */ }
                }
            }
        } else {
            // JSON fallback (no file)
            const body = await request.json();
            tipo = body.tipo ?? "";
            nombre = body.nombre ?? "";
            estatus = body.estatus ?? "Entregado";
        }

        if (!tipo || !nombre) {
            return NextResponse.json(
                { error: "Se requieren 'tipo' y 'nombre'." },
                { status: 400 }
            );
        }

        // Verificar que el expediente existe
        const exp = await prisma.expediente.findUnique({ where: { id: expedienteId } });
        if (!exp) {
            return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
        }

        // Crear registro del documento con OCR ya incluido
        const doc = await prisma.documento.create({
            data: {
                expedienteId,
                tipo,
                nombre,
                estatus,
                ...(fileUrl && { url: fileUrl }),
                ...(fileSize !== undefined && { size: fileSize }),
                ...(datosExtraidos && { datosExtraidos }),
            },
        });

        // Recalcular completitud
        const docsActualizados = await prisma.documento.findMany({ where: { expedienteId } });
        const resultado = calcularCompletitud({ ...exp, documentos: docsActualizados });

        await prisma.expediente.update({
            where: { id: expedienteId },
            data: { completitud: resultado.totalPct },
        });

        return NextResponse.json({
            success: true,
            data: doc,
            completitud: resultado.totalPct,
            ...(ocrData && { ocrData }),
        });

    } catch (error: any) {
        console.error(`POST /api/expedientes/${(await params).id}/documentos:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── GET /api/expedientes/[id]/documentos ────────────────────────────────────
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: expedienteId } = await params;
    try {
        const docs = await prisma.documento.findMany({
            where: { expedienteId },
            orderBy: { fecha: "desc" },
        });
        return NextResponse.json({ success: true, data: docs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
