import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8")
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    env: {
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
    },
};

export default nextConfig;
