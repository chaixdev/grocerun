"use client"

import { useState } from "react"
import { createInvitation, joinHousehold } from "@/actions/invitation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Copy, Check, Loader2, UserPlus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface InvitationManagerProps {
    households: {
        id: string
        name: string
    }[]
}

export function InvitationManager({ households }: InvitationManagerProps) {
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [joinToken, setJoinToken] = useState("")
    const [isJoining, setIsJoining] = useState(false)
    const [copied, setCopied] = useState(false)

    async function handleGenerateInvite(householdId: string) {
        setIsGenerating(true)
        try {
            const result = await createInvitation(householdId)
            if (result.success && result.token) {
                setInviteToken(result.token)
            } else {
                toast.error("Error", { description: result.error || "Failed to create invitation" })
            }
        } catch (error) {
            toast.error("Error", { description: "An unexpected error occurred" })
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleJoinHousehold() {
        if (!joinToken.trim()) return

        setIsJoining(true)
        try {
            const result = await joinHousehold(joinToken)
            if (result.success) {
                toast.success("Joined Household", {
                    description: `You have successfully joined ${result.householdName}`
                })
                setJoinToken("")
            } else {
                toast.error("Error", { description: result.error || "Failed to join household" })
            }
        } catch (error) {
            toast.error("Error", { description: "An unexpected error occurred" })
        } finally {
            setIsJoining(false)
        }
    }

    function copyToClipboard() {
        if (inviteToken) {
            navigator.clipboard.writeText(inviteToken)
            setCopied(true)
            toast.success("Copied", { description: "Invitation code copied to clipboard" })
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="space-y-6">
            {/* Join Household Section */}
            <div className="flex gap-2">
                <Input
                    placeholder="Enter invitation code..."
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                />
                <Button onClick={handleJoinHousehold} disabled={isJoining || !joinToken.trim()}>
                    {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Join
                </Button>
            </div>

            {/* Invite Members Section (Per Household) */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Your Households</h3>
                {households.map((household) => (
                    <Card key={household.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base">{household.name}</CardTitle>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => handleGenerateInvite(household.id)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Invite to {household.name}</DialogTitle>
                                            <DialogDescription>
                                                Share this code with someone to let them join your household.
                                                This code is valid for 24 hours and can only be used once.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {isGenerating ? (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </div>
                                        ) : inviteToken ? (
                                            <div className="flex items-center space-x-2 mt-4">
                                                <div className="grid flex-1 gap-2">
                                                    <Input
                                                        readOnly
                                                        value={inviteToken}
                                                        className="text-center font-mono text-lg tracking-widest"
                                                    />
                                                </div>
                                                <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    <span className="sr-only">Copy</span>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground p-4">
                                                Click "Invite" to generate a new code.
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
