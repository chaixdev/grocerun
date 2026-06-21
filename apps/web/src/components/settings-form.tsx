
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
import { CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useOidc } from "@/core/auth/oidc"
import { clearAppAuth } from "@/core/auth/session"
import { ChevronDown, ChevronRight, LogOut, RefreshCw } from "lucide-react"
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
    const oidc = useOidc()
    const [mounted, setMounted] = useState(false)
    const updateProfile = useUpdateProfile()
    const [profileOpen, setProfileOpen] = useState(false)
    const [householdsOpen, setHouseholdsOpen] = useState(false)
    const [generalOpen, setGeneralOpen] = useState(false)

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
        <div className="divide-y divide-border border-b">
            <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
                <CollapsibleTrigger asChild>
                    <button type="button" className="flex w-full items-center justify-between py-4 text-left">
                        <div>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription className="mt-1">
                                Display name, avatar, and logout.
                            </CardDescription>
                        </div>
                        {profileOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="pb-6 space-y-6">
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

                        <Separator />

                        <div className="space-y-2">
                            <p className="font-medium">Logout</p>
                            <p className="text-sm text-muted-foreground">
                                Sign out of your account on this device.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    clearAppAuth()
                                    if (oidc.isUserLoggedIn) {
                                        oidc.logout({ redirectTo: "home" })
                                    } else {
                                        void router.navigate({ to: "/login" })
                                    }
                                }}
                                className="w-full sm:w-auto"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={householdsOpen} onOpenChange={setHouseholdsOpen}>
                <CollapsibleTrigger asChild>
                    <button type="button" className="flex w-full items-center justify-between py-4 text-left">
                        <div>
                            <CardTitle>Households</CardTitle>
                            <CardDescription className="mt-1">
                                Create households, manage memberships, and review your household cards.
                            </CardDescription>
                        </div>
                        {householdsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="pb-6">
                        <InvitationManager userId={user.id} households={households} invitationTimeoutMinutes={invitationTimeoutMinutes} />
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
                <CollapsibleTrigger asChild>
                    <button type="button" className="flex w-full items-center justify-between py-4 text-left">
                        <div>
                            <CardTitle>General</CardTitle>
                            <CardDescription className="mt-1">
                                Appearance and developer options.
                            </CardDescription>
                        </div>
                        {generalOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="pb-6 space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                                <p className="font-medium">Theme</p>
                                <p className="text-sm text-muted-foreground">
                                    Select your preferred theme.
                                </p>
                            </div>
                            <ModeToggle />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-lg border p-4">
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
                            </div>

                            <div className="space-y-2 rounded-lg border p-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (!confirm('This will delete all local data and re-sync from the server. Continue?')) return
                                        try {
                                            await resetRxDb()
                                            router.navigate({ to: "/lists", replace: true })
                                        } catch (err) {
                                            console.error('Reset failed:', err)
                                        }
                                    }}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Force clean &amp; resync
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Wipe local database and pull everything fresh from the server.
                                </p>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
