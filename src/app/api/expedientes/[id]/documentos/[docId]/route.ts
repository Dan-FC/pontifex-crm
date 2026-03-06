import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        await prisma.documento.delete({ where: { id: docId, expedienteId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
