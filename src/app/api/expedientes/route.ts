import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularCompletitud } from "@/lib/completitud";
import { ETAPAS_PROCESO } from "@/lib/mock-data";

// ── GET /api/expedientes ─────────────────────────────────────────────────────
// Lista todos los expedientes con documentos y filtros opcionales vía query params.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const situacion = searchParams.get("situacion");
    const etapaNombre = searchParams.get("etapa");
    const search = searchParams.get("q");

    try {
        const expedientes = await prisma.expediente.findMany({
            where: {
                AND: [
                    situacion ? { situacion } : {},
                    etapaNombre ? { etapaNombre } : {},
                    search
                        ? {
                            OR: [
                                { cliente: { contains: search } },
                                { id: { contains: search } },
                            ],
                        }
                        : {},
                ],
            },
            include: { documentos: true },
            orderBy: { fechaAlta: "desc" },
        });

        return NextResponse.json({ success: true, data: expedientes });
    } catch (error: any) {
        console.error("GET /api/expedientes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── POST /api/expedientes ────────────────────────────────────────────────────
// Crea un nuevo expediente y calcula su completitud inicial.
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            cliente, rfc, sector, email, telefono, contacto,
            ejecutivo, tipoFinanciamiento, montoSolicitado, observaciones, fechaConstitucion,
        } = body;

        if (!cliente?.trim() || !ejecutivo?.trim() || !tipoFinanciamiento?.trim()) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: cliente, ejecutivo, tipoFinanciamiento." },
                { status: 400 }
            );
        }

        // Calcular siguiente folio
        const lastFolio = await prisma.expediente.findFirst({ orderBy: { folio: "desc" }, select: { folio: true } });
        const folio = (lastFolio?.folio ?? 0) + 1;

        // Crear el expediente
        const expediente = await prisma.expediente.create({
            data: {
                folio,
                cliente: cliente.trim(),
                rfc: rfc?.trim() || "",
                sector: sector?.trim() || "",
                email: email?.trim() || "",
                telefono: telefono?.trim() || "",
                contacto: contacto?.trim() || "",
                ejecutivo: ejecutivo.trim(),
                tipoFinanciamiento: tipoFinanciamiento.trim(),
                montoSolicitado: montoSolicitado?.trim() || "",
                fechaConstitucion: fechaConstitucion?.trim() || "",
                etapa: 1,
                etapaNombre: ETAPAS_PROCESO[0],
                situacion: "En curso",
                completitud: 0,
                observaciones: observaciones?.trim() || "",
                alertas: observaciones?.trim() ? JSON.stringify([observaciones.trim()]) : "[]",
            },
            include: { documentos: true },
        });

        // Calcular completitud inicial
        const resultado = calcularCompletitud({
            ...expediente,
            alertas: expediente.alertas,
            documentos: expediente.documentos,
        });

        // Actualizar completitud y guardar log
        await prisma.expediente.update({
            where: { id: expediente.id },
            data: { completitud: resultado.totalPct },
        });

        await prisma.completitudLog.create({
            data: {
                expedienteId: expediente.id,
                totalPct: resultado.totalPct,
                categorias: JSON.stringify(resultado.categorias),
            },
        });

        await prisma.actividadLog.create({
            data: {
                expedienteId: expediente.id,
                tipo: "creado",
                descripcion: `Expediente creado para ${expediente.cliente} por ${expediente.ejecutivo}`,
                usuario: expediente.ejecutivo,
            },
        });

        return NextResponse.json(
            { success: true, data: { ...expediente, completitud: resultado.totalPct } },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("POST /api/expedientes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
