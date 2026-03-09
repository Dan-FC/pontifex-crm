"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from "recharts";
import { Briefcase, CheckCircle, TrendingUp, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { ETAPAS_PROCESO, ETAPA_COLORS, SITUACION_COLORS } from "@/lib/mock-data";

type Expediente = {
    id: string;
    cliente: string;
    etapaNombre: string;
    etapa: number;
    situacion: string;
    ejecutivo: string;
    montoSolicitado: string;
    fechaAlta: string;
    completitud: number;
};

function parseMonto(m: string): number {
    const n = parseFloat(m.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
}

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
}

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm">
            <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
            <p className="text-blue-600 font-bold">{payload[0].value} casos</p>
        </div>
    );
};

const EjTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm">
            <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
            <p className="text-indigo-600 font-bold">{payload[0].value} casos</p>
        </div>
    );
};

function EtapaCard({ etapa, casos, total }: { etapa: string; casos: Expediente[]; total: number }) {
    const [open, setOpen] = useState(false);
    const pct = total > 0 ? Math.round((casos.length / total) * 100) : 0;
    const color = ETAPA_COLORS[etapa] ?? "bg-gray-100 text-gray-700";

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(o => !o)}>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{etapa}</span>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{casos.length} caso{casos.length !== 1 ? "s" : ""}</span>
                        <span className="text-xs font-bold text-gray-700">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                </div>
                {casos.length > 0 && (
                    open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                         : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
            </div>
            {open && casos.length > 0 && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {casos.map(c => (
                        <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{c.cliente}</p>
                                <p className="text-xs text-gray-400">{c.ejecutivo}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${SITUACION_COLORS[c.situacion] ?? "bg-gray-100 text-gray-600"}`}>
                                    {c.situacion}
                                </span>
                                <span className="text-xs text-gray-400">{c.completitud}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PanelPage() {
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/expedientes");
            const json = await res.json();
            if (json.data) setExpedientes(json.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── KPIs ────────────────────────────────────────────────────────────────────
    const activos = expedientes.filter(e => e.situacion !== "Cerrado");
    const listosPropuesta = expedientes.filter(e => e.situacion === "Listo para propuesta");
    const enPropuesta = expedientes.filter(e => e.etapaNombre === "Propuesta");
    const pctConversion = expedientes.length > 0
        ? Math.round((enPropuesta.length / expedientes.length) * 100)
        : 0;
    const montoTotal = expedientes.reduce((sum, e) => sum + parseMonto(e.montoSolicitado), 0);

    const KPIS = [
        { label: "Casos activos", value: activos.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
        { label: "Listos para propuesta", value: listosPropuesta.length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        { label: "% Conversión a propuesta", value: `${pctConversion}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
        { label: "Monto potencial gestionado", value: fmtMoney(montoTotal), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    ];

    // ── Distribución por etapa ──────────────────────────────────────────────────
    const porEtapa = ETAPAS_PROCESO.map(etapa => ({
        etapa,
        casos: expedientes.filter(e => e.etapaNombre === etapa),
        count: expedientes.filter(e => e.etapaNombre === etapa).length,
    }));

    // ── Flujo mensual (por mes de alta) ────────────────────────────────────────
    const mesesMap: Record<string, number> = {};
    expedientes.forEach(e => {
        const d = new Date(e.fechaAlta);
        const key = d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
        mesesMap[key] = (mesesMap[key] ?? 0) + 1;
    });
    const flujoMensual = Object.entries(mesesMap)
        .slice(-6)
        .map(([mes, casos]) => ({ mes, casos }));

    // ── Carga por ejecutivo ────────────────────────────────────────────────────
    const ejMap: Record<string, number> = {};
    activos.forEach(e => { ejMap[e.ejecutivo] = (ejMap[e.ejecutivo] ?? 0) + 1; });
    const cargaEjecutivos = Object.entries(ejMap).map(([ejecutivo, casos]) => ({ ejecutivo, casos }));

    // ── Resumen por situación ──────────────────────────────────────────────────
    const situaciones = ["En curso", "Requiere revisión", "Listo para propuesta", "Cerrado"];
    const situacionColors: Record<string, string> = {
        "En curso": "bg-emerald-500",
        "Requiere revisión": "bg-amber-400",
        "Listo para propuesta": "bg-blue-500",
        "Cerrado": "bg-gray-300",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando datos…</div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Panel de control</h1>
                <p className="text-gray-500 mt-1">Visión ejecutiva de la operación · Nexus Pontifex</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {KPIS.map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-5`}>
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
                        <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Distribución por etapa */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Distribución por etapa del proceso</h2>
                <p className="text-xs text-gray-400 mb-4">
                    {expedientes.length} expediente{expedientes.length !== 1 ? "s" : ""} en total · click en cada etapa para ver el resumen
                </p>
                <div className="space-y-2">
                    {porEtapa.map(({ etapa, casos, count }) => (
                        <EtapaCard key={etapa} etapa={etapa} casos={casos} total={expedientes.length} />
                    ))}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Flujo mensual */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Flujo mensual de casos</h2>
                    <p className="text-xs text-gray-400 mb-5">Expedientes abiertos por mes</p>
                    {flujoMensual.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={flujoMensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradCasos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="casos" stroke="#3b82f6" strokeWidth={2.5}
                                    fill="url(#gradCasos)"
                                    dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                                    label={{ position: "top", fontSize: 11, fill: "#6b7280", fontWeight: 600 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
                    )}
                </div>

                {/* Carga por ejecutivo */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Carga operativa por ejecutivo</h2>
                    <p className="text-xs text-gray-400 mb-5">Casos activos asignados</p>
                    {cargaEjecutivos.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={cargaEjecutivos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="ejecutivo" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<EjTooltip />} />
                                <Bar dataKey="casos" radius={[6, 6, 0, 0]} fill="#818cf8"
                                    label={{ position: "top", fontSize: 12, fill: "#6b7280", fontWeight: 700 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
                    )}
                </div>
            </div>

            {/* Resumen por estado */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumen por estado</h2>
                <div className="space-y-3">
                    {situaciones.map(sit => {
                        const count = expedientes.filter(e => e.situacion === sit).length;
                        const pct = expedientes.length > 0 ? Math.round((count / expedientes.length) * 100) : 0;
                        return (
                            <div key={sit} className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${situacionColors[sit] ?? "bg-gray-300"}`} />
                                <span className="text-sm text-gray-600 flex-1">{sit}</span>
                                <span className="text-xs text-gray-400">{pct}%</span>
                                <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${situacionColors[sit] ?? "bg-gray-300"}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm font-bold text-gray-800 w-4 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Total de expedientes</p>
                    <p className="text-2xl font-extrabold text-gray-900">{expedientes.length}</p>
                </div>
            </div>
        </div>
    );
}
