import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularCompletitud } from "@/lib/completitud";
import { uploadPDF } from "@/lib/supabase";

// ── POST /api/expedientes/[id]/documentos ────────────────────────────────────
// Recibe un PDF via FormData, lo sube a Supabase Storage y crea el Documento.
// FormData fields:
//   pdf   : File  — el archivo PDF
//   docId : string — ID del checklist (ej. "acta-constitutiva")
//   nombre: string — nombre legible del documento
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: expedienteId } = await params;
    try {
        // Support both FormData (with file) and JSON (metadata only)
        const contentType = request.headers.get("content-type") ?? "";
        let tipo = "";
        let nombre = "";
        let estatus = "Entregado";
        let fileUrl: string | undefined;
        let fileSize: number | undefined;
        let datosExtraidos: string | undefined;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("pdf") as File | null;
            tipo = formData.get("docId") as string ?? formData.get("tipo") as string ?? "";
            nombre = (formData.get("nombre") as string) ?? (file?.name ?? "");
            estatus = (formData.get("estatus") as string) ?? "Entregado";
            datosExtraidos = (formData.get("datosExtraidos") as string) ?? undefined;

            if (!tipo || !nombre) {
                return NextResponse.json(
                    { error: "Se requieren 'docId' y 'nombre' en el FormData." },
                    { status: 400 }
                );
            }

            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result = await uploadPDF(buffer, expedienteId, tipo, file.name);
                fileUrl = result.url;
                fileSize = result.size;
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

        // Verify expediente exists
        const exp = await prisma.expediente.findUnique({ where: { id: expedienteId } });
        if (!exp) {
            return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
        }

        // Create document record
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

        // Recalculate completitud
        const docsActualizados = await prisma.documento.findMany({ where: { expedienteId } });
        const resultado = calcularCompletitud({ ...exp, documentos: docsActualizados });

        await prisma.expediente.update({
            where: { id: expedienteId },
            data: { completitud: resultado.totalPct },
        });

        return NextResponse.json({ success: true, data: doc, completitud: resultado.totalPct });
    } catch (error: any) {
        console.error(`POST /api/expedientes/${(await params).id}/documentos:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── GET /api/expedientes/[id]/documentos ────────────────────────────────────
// Lista todos los documentos del expediente con sus URLs de descarga.
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
