import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const logs = await prisma.actividadLog.findMany({
            where: { expedienteId: id },
            orderBy: { creadoEn: "desc" },
            take: 100,
        });
        return NextResponse.json({ success: true, data: logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
