import NextAuth from "next-auth"
import { authConfig } from "@/core/auth/auth.config"

// Middleware uses authConfig without the PrismaAdapter, which requires
// Node.js runtime. JWT session validation works without the adapter.
export default NextAuth(authConfig).auth

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
