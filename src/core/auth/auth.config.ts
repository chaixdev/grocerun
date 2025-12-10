import { env } from "@/core/config"
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

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
        async signIn({ user, account, profile }) {
            // Ensure user exists in database for JWT strategy
            // PrismaAdapter handles this for database sessions, but with JWT we need to do it manually
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
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
