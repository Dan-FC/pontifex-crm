import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      {/* Fondo */}
      <Image
        src="/bg-login.jpg"
        alt=""
        fill
        className="object-cover"
        priority
      />
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-blue-950/40" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-nexus.png"
              alt="Nexus Pontifex"
              style={{ width: "500px", height: "auto" }}
            />
          </div>

          <p className="text-center text-gray-400 text-sm">Motor Inteligente de Estructuración Financiera</p>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              defaultValue="demo@nexuspontifex.mx"
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              defaultValue="password"
            />
          </div>

          <Link
            href="/panel"
            className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center shadow-lg"
          >
            Entrar al Sistema
          </Link>
        </div>
      </div>
    </div>
  );
}
