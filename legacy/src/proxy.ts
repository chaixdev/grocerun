import { auth } from "@/core/auth"

// Reuse the fully configured NextAuth instance (with adapter/callbacks)
export default auth

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
