import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularCompletitud } from "@/lib/completitud";

// ── GET /api/expedientes/[id] ────────────────────────────────────────────────
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const expediente = await prisma.expediente.findUnique({
            where: { id },
            include: {
                documentos: { orderBy: { fecha: "desc" } },
                completitudLog: { orderBy: { creadoEn: "desc" }, take: 1 },
            },
        });

        if (!expediente) {
            return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
        }

        // Siempre recalcular para mostrar datos frescos
        const resultado = calcularCompletitud({
            ...expediente,
            documentos: expediente.documentos,
        });

        return NextResponse.json({
            success: true,
            data: expediente,
            completitudDetalle: resultado,
        });
    } catch (error: any) {
        console.error(`GET /api/expedientes/${id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── PATCH /api/expedientes/[id] ──────────────────────────────────────────────
// Actualiza campos del expediente (etapa, situacion, observaciones, etc.)
// y recalcula la completitud.
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // Solo permite actualizar campos seguros
        const allowedFields = [
            "etapa", "etapaNombre", "situacion", "observaciones",
            "rfc", "email", "telefono", "contacto", "montoSolicitado",
            "tipoFinanciamiento", "sector", "matrizRiesgo",
        ];
        const updateData: Record<string, any> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) updateData[key] = body[key];
        }

        const expediente = await prisma.expediente.update({
            where: { id },
            data: updateData,
            include: { documentos: true },
        });

        // Recalcular completitud
        const resultado = calcularCompletitud({
            ...expediente,
            documentos: expediente.documentos,
        });

        await prisma.expediente.update({
            where: { id },
            data: { completitud: resultado.totalPct },
        });

        await prisma.completitudLog.create({
            data: {
                expedienteId: id,
                totalPct: resultado.totalPct,
                categorias: JSON.stringify(resultado.categorias),
            },
        });

        return NextResponse.json({
            success: true,
            data: { ...expediente, completitud: resultado.totalPct },
            completitudDetalle: resultado,
        });
    } catch (error: any) {
        console.error(`PATCH /api/expedientes/${id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
