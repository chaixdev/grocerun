import { env } from "@/core/config"
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

const trustHost = env.AUTH_TRUST_HOST === "true" || env.NODE_ENV !== "production"

export const authConfig = {
    providers: [
        Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    trustHost,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            if (isLoggedIn) {
                if (nextUrl.pathname === '/login') {
                    return Response.redirect(new URL('/stores', nextUrl));
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            // Add the raw JWT to the session for API authentication
            session.accessToken = token
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id
            }
            return token
        }
    },
    session: { strategy: "jwt" },
} satisfies NextAuthConfig
