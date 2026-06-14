import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8")
);

const apiUrl = process.env.API_URL || "http://localhost:3001";

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    env: {
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
    },
    async rewrites() {
        return [
            {
                source: "/api/v1/:path*",
                destination: `${apiUrl}/:path*`, // Proxy to NestJS
            },
        ];
    },
};

export default nextConfig;
