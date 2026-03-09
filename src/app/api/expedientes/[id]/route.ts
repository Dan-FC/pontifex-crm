import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularCompletitud } from "@/lib/completitud";
import { supabase } from "@/lib/supabase";

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
            "tipoFinanciamiento", "sector", "matrizRiesgo", "fechaConstitucion",
        ];
        const updateData: Record<string, any> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) updateData[key] = body[key];
        }

        // Capturar valores anteriores para el log de actividad
        const anterior = await prisma.expediente.findUnique({ where: { id } });

        const expediente = await prisma.expediente.update({
            where: { id },
            data: updateData,
            include: { documentos: true },
        });

        // Registrar cambios en el log de actividad
        const CAMPO_LABELS: Record<string, string> = {
            etapa: "Etapa", etapaNombre: "Nombre de etapa", situacion: "Situación",
            observaciones: "Observaciones", rfc: "RFC", email: "Correo",
            telefono: "Teléfono", contacto: "Contacto", montoSolicitado: "Monto solicitado",
            tipoFinanciamiento: "Tipo de financiamiento", sector: "Sector",
            matrizRiesgo: "Matriz de riesgo", fechaConstitucion: "Fecha de constitución",
        };
        const usuario = body._usuario ?? "Sistema";
        for (const key of Object.keys(updateData)) {
            if (key === "matrizRiesgo") {
                await prisma.actividadLog.create({
                    data: {
                        expedienteId: id,
                        tipo: "campo_actualizado",
                        descripcion: "Matriz de riesgo actualizada",
                        usuario,
                    },
                });
            } else if (anterior && String(anterior[key as keyof typeof anterior]) !== String(updateData[key])) {
                await prisma.actividadLog.create({
                    data: {
                        expedienteId: id,
                        tipo: "campo_actualizado",
                        descripcion: `${CAMPO_LABELS[key] ?? key} actualizado: "${anterior[key as keyof typeof anterior]}" → "${updateData[key]}"`,
                        usuario,
                        metadata: JSON.stringify({ campo: key, anterior: anterior[key as keyof typeof anterior], nuevo: updateData[key] }),
                    },
                });
            }
        }

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

        // Si se actualizó matrizRiesgo, respaldar en Supabase Storage
        if (updateData.matrizRiesgo) {
            try {
                await supabase.storage
                    .from("documentos")
                    .upload(
                        `${id}/analisis/matriz-riesgo.json`,
                        Buffer.from(updateData.matrizRiesgo, "utf-8"),
                        { contentType: "application/json", upsert: true }
                    );
            } catch { /* no bloquear si falla el backup */ }
        }

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
