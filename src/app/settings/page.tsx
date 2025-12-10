import { auth } from "@/core/auth";
import { prisma } from "@/core/db";
import { SettingsForm } from "@/components/settings-form";
import { redirect } from "next/navigation";

import { appConfig } from "@/core/config";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                households: {
                    include: { _count: { select: { users: true } } }
                }
            },
        });
    } catch (error) {
        console.error("Settings page - failed to fetch user:", error);
        redirect("/login");
    }

    if (!user) {
        console.error("Settings page - user not found in database:", session.user.id);
        redirect("/login");
    }

    // Settings page is accessible even without households
    // Users can update profile and will see household invitation section

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
                households={user.households}
                invitationTimeoutMinutes={appConfig.invitation.expiresInMinutes}
            />
        </div>
    );
}
