import { auth } from "@/core/auth";
import { SettingsForm } from "@/components/settings-form";
import { redirect } from "next/navigation";
import { appConfig } from "@/core/config";
import { apiClient } from "@/core/lib/api-client";
import { SignJWT } from "jose";
import { z } from "zod";

const HouseholdsResponseSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string().nullable(),
    _count: z.object({ users: z.number() }),
}))

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const token = (session as any).accessToken
    if (!token?.sub) {
        redirect("/login");
    }

    let households: z.infer<typeof HouseholdsResponseSchema> = []
    try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        households = await apiClient.get('/households', HouseholdsResponseSchema, jwt)
    } catch (error) {
        console.error("Settings page - failed to fetch households:", error)
        // Non-fatal: render page with empty households
    }

    const user = {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
    }

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <SettingsForm
                user={user}
                households={households}
                invitationTimeoutMinutes={appConfig.invitation.expiresInMinutes}
            />
            <div className="text-center text-xs text-muted-foreground pt-8">
                v{process.env.NEXT_PUBLIC_APP_VERSION}
            </div>
        </div>
    );
}
