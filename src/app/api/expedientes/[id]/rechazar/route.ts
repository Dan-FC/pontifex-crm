import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { motivo, responsable } = await request.json();

        if (!motivo || !responsable) {
            return NextResponse.json({ error: "motivo y responsable son requeridos" }, { status: 400 });
        }

        const expediente = await prisma.expediente.update({
            where: { id },
            data: {
                situacion: "Rechazado",
                rechazoMotivo: motivo,
                rechazoResponsable: responsable,
                rechazoFecha: new Date().toISOString(),
            },
            include: { documentos: true },
        });

        await prisma.actividadLog.create({
            data: {
                expedienteId: id,
                tipo: "rechazado",
                descripcion: `Caso rechazado por ${responsable}. Motivo: ${motivo}`,
                usuario: responsable,
                metadata: JSON.stringify({ motivo, responsable }),
            },
        });

        return NextResponse.json({ success: true, data: expediente });
    } catch (error: any) {
        console.error(`POST /api/expedientes/${id}/rechazar:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
