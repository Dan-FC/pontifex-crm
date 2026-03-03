import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // PDF / Excel processing
    "pdf-parse", "tesseract.js", "xlsx-populate",
    // Prisma 7 + SQLite adapter (must not be bundled by webpack)
    "@prisma/client", ".prisma/client", "prisma",
    "@prisma/adapter-better-sqlite3", "better-sqlite3",
  ],
};

export default nextConfig;
