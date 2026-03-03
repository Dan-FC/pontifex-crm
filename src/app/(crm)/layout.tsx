import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
