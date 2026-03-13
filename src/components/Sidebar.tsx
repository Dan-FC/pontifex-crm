"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FolderKanban, Building2, LogOut } from "lucide-react";

const NAV_ITEMS = [
    { label: "Panel de control", href: "/panel", icon: LayoutDashboard },
    { label: "Casos", href: "/casos", icon: FolderKanban },
    { label: "Opciones de financiamiento", href: "/financiamiento", icon: Building2 },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] flex flex-col z-30">
            {/* Logo */}
            <div className="px-4 py-8 border-b border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo-nexus.png"
                    alt="Nexus Pontifex"
                    style={{ width: "100%", height: "auto", filter: "brightness(0) invert(1)" }}
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${isActive
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="leading-tight">{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: Cerrar sesión */}
            <div className="px-3 pb-5 border-t border-white/10 pt-4">
                <button
                    onClick={() => router.push("/")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-slate-200 transition-all"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span>Cerrar sesión</span>
                </button>
                <p className="text-xs text-slate-700 font-medium mt-3 px-1">Nexus Pontifex · v2.0</p>
            </div>
        </aside>
    );
}
