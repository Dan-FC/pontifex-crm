"use client";

import React, { useState } from "react";
import { Building2, Filter, ChevronDown, Info } from "lucide-react";
import { MOCK_INSTITUCIONES, COMPATIBILIDAD_COLORS } from "@/lib/mock-data";

const TIPOS = ["Todos", "Crédito simple", "Línea de crédito revolvente", "Arrendamiento financiero", "Factoraje financiero", "Crédito hipotecario empresarial", "Crédito verde / sostenible"];
const COMPATIBILIDAD_OPTS = ["Todas", "Alta", "Compatible con condiciones", "Requiere información adicional"];

const COMPATIBILIDAD_ICONS: Record<string, string> = {
    "Alta": "🟢",
    "Compatible con condiciones": "🟡",
    "Requiere información adicional": "🔴",
};

export default function FinanciamientoPage() {
    const [filterTipo, setFilterTipo] = useState("Todos");
    const [filterComp, setFilterComp] = useState("Todas");
    const [expanded, setExpanded] = useState<string | null>(null);

    const filtered = MOCK_INSTITUCIONES.filter(inst => {
        const matchTipo = filterTipo === "Todos" || inst.tipo === filterTipo;
        const matchComp = filterComp === "Todas" || inst.compatibilidad === filterComp;
        return matchTipo && matchComp;
    });

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Opciones de financiamiento</h1>
                <p className="text-gray-500 mt-1">Instituciones y productos financieros compatibles con el perfil del expediente</p>
            </div>

            {/* Disclaimer banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-700">
                    Las opciones mostradas son <strong>recomendaciones basadas en el perfil del expediente</strong>. Nexus Pontifex actúa como intermediario y no garantiza la autorización de ningún producto por parte de las instituciones financieras. Los montos, plazos y tasas son estimados sujetos a validación.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Filtros</span>
                </div>
                <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={filterComp} onChange={e => setFilterComp(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {COMPATIBILIDAD_OPTS.map(c => <option key={c}>{c}</option>)}
                </select>
                {(filterTipo !== "Todos" || filterComp !== "Todas") && (
                    <button onClick={() => { setFilterTipo("Todos"); setFilterComp("Todas"); }}
                        className="text-xs text-gray-400 hover:text-gray-600 underline">Limpiar</button>
                )}
                <span className="ml-auto text-xs text-gray-400">{filtered.length} opción{filtered.length !== 1 ? "es" : ""}</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Institución</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto estimado</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plazo est.</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasa est.</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Compatibilidad</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(inst => (
                                <React.Fragment key={inst.id}>
                                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === inst.id ? null : inst.id)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <span className="font-semibold text-gray-900 whitespace-nowrap">{inst.institucion}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">{inst.producto}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 max-w-[130px]">
                                            <span className="inline-block">{inst.tipo}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-500">de {inst.montoMin}</div>
                                            <div className="text-sm font-semibold text-gray-800">hasta {inst.montoMax}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{inst.plazo}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600 whitespace-nowrap">{inst.tasa}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${COMPATIBILIDAD_COLORS[inst.compatibilidad]}`}>
                                                <span>{COMPATIBILIDAD_ICONS[inst.compatibilidad]}</span>
                                                {inst.compatibilidad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                <ChevronDown className={`w-4 h-4 transition-transform ${expanded === inst.id ? "rotate-180" : ""}`} />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded detail row */}
                                    {expanded === inst.id && (
                                        <tr className="bg-indigo-50/40 border-l-4 border-indigo-300">
                                            <td colSpan={8} className="px-8 py-5">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Requisitos principales</p>
                                                        <p className="text-sm text-gray-700">{inst.requisitos}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Sectores compatibles</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {inst.sector.map(s => (
                                                                <span key={s} className="px-2 py-0.5 bg-white border border-gray-200 text-xs text-gray-600 rounded-full">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Observaciones</p>
                                                        <p className="text-sm text-gray-700">{inst.observaciones}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-indigo-100">
                                                    <p className="text-xs text-indigo-500 italic">
                                                        ⚠ Esta información es orientativa. La elegibilidad final será determinada por la institución financiera durante el proceso de validación.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm">No se encontraron opciones con los filtros seleccionados.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

