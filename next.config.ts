import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // PDF / Excel processing
    "pdf-parse", "tesseract.js", "xlsx-populate",
    // Prisma 7 + PostgreSQL adapter
    "@prisma/client", ".prisma/client", "prisma",
    "@prisma/adapter-pg", "pg",
  ],
};

export default nextConfig;
