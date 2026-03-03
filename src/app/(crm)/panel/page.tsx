"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from "recharts";
import { Briefcase, Clock, Eye, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { DASHBOARD_KPI, EMBUDO_DATA, FLUJO_MENSUAL, CARGA_EJECUTIVOS } from "@/lib/mock-data";

const KPIS = [
    { label: "Casos activos", value: DASHBOARD_KPI.totalActivos, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Requieren revisión", value: DASHBOARD_KPI.requierenRevision, icon: Eye, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Observados", value: DASHBOARD_KPI.observados, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "Listos para propuesta", value: DASHBOARD_KPI.listosPropuesta, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Tiempo prom. de análisis", value: `${DASHBOARD_KPI.tiempoPromedio} días`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { label: "Monto potencial gestionado", value: DASHBOARD_KPI.montoGestionado, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
];

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

export default function PanelPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Panel de control</h1>
                <p className="text-gray-500 mt-1">Visión ejecutiva de la operación · Nexus Pontifex</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Embudo por etapa */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Distribución por etapa del proceso</h2>
                    <p className="text-xs text-gray-400 mb-5">Casos activos por cada fase del análisis</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={EMBUDO_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="etapa" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={130} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="casos" radius={[0, 6, 6, 0]} fill="#6366f1"
                                label={{ position: "right", fontSize: 11, fill: "#6b7280", fontWeight: 600 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Flujo mensual */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Flujo mensual de casos</h2>
                    <p className="text-xs text-gray-400 mb-5">Últimos 4 meses · nuevos expedientes abiertos</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={FLUJO_MENSUAL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Carga por ejecutivo */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Carga operativa por ejecutivo</h2>
                    <p className="text-xs text-gray-400 mb-5">Casos activos asignados</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={CARGA_EJECUTIVOS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="ejecutivo" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<EjTooltip />} />
                            <Bar dataKey="casos" radius={[6, 6, 0, 0]} fill="#818cf8"
                                label={{ position: "top", fontSize: 12, fill: "#6b7280", fontWeight: 700 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Resumen estatus */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumen por estatus</h2>
                    <div className="space-y-3">
                        {[
                            { label: "En curso", count: 7, color: "bg-emerald-500" },
                            { label: "Requieren revisión", count: 2, color: "bg-amber-400" },
                            { label: "Observados", count: 1, color: "bg-orange-500" },
                            { label: "Listos para propuesta", count: 2, color: "bg-blue-500" },
                            { label: "Cerrados", count: 0, color: "bg-gray-300" },
                        ].map(({ label, count, color }) => (
                            <div key={label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                    <span className="text-sm text-gray-600">{label}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">Total de casos</p>
                        <p className="text-2xl font-extrabold text-gray-900">12</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

