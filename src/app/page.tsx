import Link from "next/link";
import { LogIn, Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nexus Pontifex</h1>
          <p className="text-gray-500">Motor Inteligente de Estructuración Financiera</p>

          <div className="space-y-4 pt-4">
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 bg-white placeholder-gray-400"
                defaultValue="demo@nexuspontifex.mx"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 bg-white placeholder-gray-400"
                defaultValue="password"
              />
            </div>
          </div>

          <Link
            href="/panel"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mt-6 text-center"
          >
            Entrar al Sistema
          </Link>
        </div>
      </div>
    </div>
  );
}
