
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { router } from "@/router"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useOidc } from "@/core/auth/oidc"
import { LogOut, RefreshCw } from "lucide-react"
import { resetRxDb } from "@/core/rxdb"
import { Checkbox } from "@/components/ui/checkbox"
import { UpdateProfileSchema, type UpdateProfileDto } from "@grocerun/dto"
import { InvitationManager } from "@/features/households"
import { useUpdateProfile } from "@/hooks/useProfile"
import type { SettingsHousehold } from "@/features/households/hooks/useInvitations"

interface SettingsFormProps {
    user: {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
    }
    households: SettingsHousehold[]
    invitationTimeoutMinutes: number
}

export function SettingsForm({ user, households, invitationTimeoutMinutes }: SettingsFormProps) {
    const oidc = useOidc({ assert: "user logged in" })
    const [mounted, setMounted] = useState(false)
    const updateProfile = useUpdateProfile()

    const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(false)

    useEffect(() => {
        setMounted(true)
        setDiagnosticsEnabled(localStorage.getItem('grocerun-diagnostics') === 'true')
    }, [])

    const form = useForm<UpdateProfileDto>({
        resolver: zodResolver(UpdateProfileSchema),
        defaultValues: {
            name: user.name || "",
            image: user.image || "",
        },
    })

    function onSubmit(values: UpdateProfileDto) {
        updateProfile.mutate(values)
    }

    if (!mounted) {
        return null
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        Manage your public profile information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Avatar URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/avatar.jpg" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Enter a URL for your profile picture.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={updateProfile.isPending}>
                                {updateProfile.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Customize how the app looks on your device.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">
                            Select your preferred theme.
                        </p>
                    </div>
                    <ModeToggle />
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Households</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage your household memberships and invite others.
                        </p>
                    </div>
                </div>
                <Separator />
                <InvitationManager userId={user.id} households={households} invitationTimeoutMinutes={invitationTimeoutMinutes} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Developer</CardTitle>
                    <CardDescription>
                        Debugging tools for sync and replication.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                            checked={diagnosticsEnabled}
                            onCheckedChange={(checked) => {
                                const enabled = checked === true
                                setDiagnosticsEnabled(enabled)
                                localStorage.setItem('grocerun-diagnostics', String(enabled))
                                window.dispatchEvent(new StorageEvent('storage', { key: 'grocerun-diagnostics', newValue: String(enabled) }))
                            }}
                        />
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Sync diagnostics</p>
                            <p className="text-xs text-muted-foreground">
                                Show a floating overlay with SSE status, pull/push logs, and auth state.
                            </p>
                        </div>
                    </label>
                    <Separator className="my-4" />
                    <div className="space-y-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                if (!confirm('This will delete all local data and re-sync from the server. Continue?')) return
                                await resetRxDb()
                                router.navigate({ to: "/lists", replace: true })
                            }}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Force clean &amp; resync
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Wipe local database and pull everything fresh from the server.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Sign out of your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={() => oidc.logout({ redirectTo: "home" })}
                        className="w-full sm:w-auto"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
