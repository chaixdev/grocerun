import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";
import { redirect } from "next/navigation";

import { appConfig } from "@/lib/app-config";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            households: {
                include: { _count: { select: { users: true } } }
            }
        },
    });

    if (!user) {
        redirect("/login");
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
                households={user.households}
                invitationTimeoutMinutes={appConfig.invitation.expiresInMinutes}
            />
        </div>
    );
}
