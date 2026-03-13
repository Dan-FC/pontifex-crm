import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePDF } from "@/lib/supabase";

// ── PATCH /api/expedientes/[id]/documentos/[docId] ───────────────────────────
// Actualiza datosExtraidos y/o nombre de un documento específico.
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    const { id: expedienteId, docId } = await params;
    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};
        if (body.datosExtraidos !== undefined) {
            updateData.datosExtraidos = typeof body.datosExtraidos === "string"
                ? body.datosExtraidos
                : JSON.stringify(body.datosExtraidos);
        }
        if (body.nombre !== undefined) updateData.nombre = body.nombre;

        const doc = await prisma.documento.update({
            where: { id: docId, expedienteId },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: doc });
    } catch (error: any) {
        console.error(`PATCH /api/expedientes/${expedienteId}/documentos/${docId}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── DELETE /api/expedientes/[id]/documentos/[docId] ──────────────────────────
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    const { id: expedienteId, docId } = await params;
    try {
        // Obtener URL antes de borrar el registro para poder limpiar Storage
        const doc = await prisma.documento.findUnique({
            where: { id: docId, expedienteId },
            select: { url: true },
        });

        await prisma.documento.delete({ where: { id: docId, expedienteId } });

        // Eliminar archivo de Supabase Storage (no bloqueante si falla)
        if (doc?.url) {
            await deletePDF(doc.url).catch(e =>
                console.warn("No se pudo eliminar archivo de Storage:", e)
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
