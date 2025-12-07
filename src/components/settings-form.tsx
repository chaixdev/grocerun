"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateProfile } from "@/actions/user"
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
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { ProfileSchema, type ProfileFormValues } from "@/lib/schemas/user"
import { InvitationManager } from "@/components/invitation-manager"

interface SettingsFormProps {
    user: {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
    }
    households: {
        id: string
        name: string
        ownerId: string | null
    }[]
}

export function SettingsForm({ user, households }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            name: user.name || "",
            image: user.image || "",
        },
    })

    async function onSubmit(values: ProfileFormValues) {
        setIsLoading(true)
        try {
            const result = await updateProfile(values)

            if (result.success) {
                toast.success("Profile updated", {
                    description: "Your profile has been updated successfully.",
                })
            } else {
                toast.error("Error", {
                    description: result.error || "Failed to update profile.",
                })
            }
        } catch (error) {
            toast.error("Error", {
                description: "An unexpected error occurred.",
            })
        } finally {
            setIsLoading(false)
        }
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
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
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
                <InvitationManager userId={user.id} households={households} />
            </div>

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
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full sm:w-auto"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div >
    )
}
