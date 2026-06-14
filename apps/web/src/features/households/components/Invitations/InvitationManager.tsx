
"use client"

import { useState } from "react"
import { createInvitation, joinHousehold, getInvitationDetails } from "@/actions/invitation"
import { createHousehold, renameHousehold, leaveHousehold, deleteHousehold } from "@/actions/household"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Copy, Check, Loader2, UserPlus, Plus, Pencil, Shield, User, LogOut, Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface InvitationManagerProps {
    userId: string
    households: {
        id: string
        name: string
        ownerId: string | null
        _count: { users: number }
    }[]
    invitationTimeoutMinutes: number
}

export function InvitationManager({ userId, households, invitationTimeoutMinutes }: InvitationManagerProps) {
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [joinToken, setJoinToken] = useState("")
    const [isJoining, setIsJoining] = useState(false)
    const [copied, setCopied] = useState(false)

    // Join Confirmation State
    const [joinDetails, setJoinDetails] = useState<{ householdName: string, ownerName: string } | null>(null)
    const [isFetchingDetails, setIsFetchingDetails] = useState(false)
    const [showJoinDialog, setShowJoinDialog] = useState(false)

    // Create/Rename State
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [newHouseholdName, setNewHouseholdName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [editingHousehold, setEditingHousehold] = useState<{ id: string, name: string } | null>(null)
    const [renameValue, setRenameValue] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)

    // Leave/Delete State
    const [householdToLeave, setHouseholdToLeave] = useState<{ id: string, name: string } | null>(null)
    const [isLeaving, setIsLeaving] = useState(false)
    const [householdToDelete, setHouseholdToDelete] = useState<{ id: string, name: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Invite Dialog State
    const [activeInviteHouseholdId, setActiveInviteHouseholdId] = useState<string | null>(null)

    async function handleGenerateInvite(householdId: string) {
        setIsGenerating(true)
        try {
            const result = await createInvitation({ householdId })
            if (result.success) {
                if (result.data.token) {
                    setInviteToken(result.data.token)
                } else {
                    toast.error("Error", { description: "No invitation token received" })
                }
            } else {
                toast.error("Error", { description: result.error || "Failed to create invitation" })
            }
        } catch (error) {
            toast.error("Error", { description: "An unexpected error occurred" })
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleInitiateJoin() {
        if (!joinToken.trim()) return

        setIsFetchingDetails(true)
        try {
            const details = await getInvitationDetails({ token: joinToken })
            if (details.success) {
                if (details.data.householdName) {
                    setJoinDetails({
                        householdName: details.data.householdName,
                        ownerName: details.data.ownerName || "Unknown"
                    })
                    setShowJoinDialog(true)
                } else {
                    toast.error("Error", { description: "Invitation details incomplete" })
                }
            } else {
                toast.error("Error", { description: details.error || "Invalid invitation code" })
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to verify invitation" })
        } finally {
            setIsFetchingDetails(false)
        }
    }

    async function handleConfirmJoin() {
        setIsJoining(true)
        try {
            const result = await joinHousehold({ token: joinToken })
            if (result.success) {
                toast.success("Joined Household", {
                    description: `You have successfully joined ${result.data.householdName} `
                })
                setJoinToken("")
                setShowJoinDialog(false)
                setJoinDetails(null)
            } else {
                toast.error("Error", { description: result.error || "Failed to join household" })
            }
        } catch (error) {
            toast.error("Error", { description: "An unexpected error occurred" })
        } finally {
            setIsJoining(false)
        }
    }

    async function handleCreateHousehold() {
        if (!newHouseholdName.trim()) return
        setIsCreating(true)
        const result = await createHousehold({ name: newHouseholdName })
        if (result.success) {
            toast.success("Household Created")
            setShowCreateDialog(false)
            setNewHouseholdName("")
        } else {
            toast.error("Error", { description: result.error || "Failed to create household" })
        }
        setIsCreating(false)
    }

    async function handleRenameHousehold() {
        if (!editingHousehold || !renameValue.trim()) return
        setIsRenaming(true)
        const result = await renameHousehold({ householdId: editingHousehold.id, name: renameValue })
        if (result.success) {
            toast.success("Household Renamed")
            setEditingHousehold(null)
        } else {
            toast.error("Error", { description: result.error || "Failed to rename household" })
        }
        setIsRenaming(false)
    }

    async function handleLeaveHousehold() {
        if (!householdToLeave) return
        setIsLeaving(true)
        try {
            const result = await leaveHousehold(householdToLeave.id)
            if (result.success) {
                toast.success("Left Household", { description: `You have left ${householdToLeave.name}` })
                setHouseholdToLeave(null)
            } else {
                toast.error("Error", { description: result.error })
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to leave household" })
        } finally {
            setIsLeaving(false)
        }
    }

    async function handleDeleteHousehold() {
        if (!householdToDelete) return
        setIsDeleting(true)
        try {
            const result = await deleteHousehold(householdToDelete.id)
            if (result.success) {
                toast.success("Household Deleted", { description: `${householdToDelete.name} has been deleted` })
                setHouseholdToDelete(null)
            } else {
                toast.error("Error", { description: result.error })
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to delete household" })
        } finally {
            setIsDeleting(false)
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
                <Button onClick={handleInitiateJoin} disabled={isFetchingDetails || !joinToken.trim()}>
                    {isFetchingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Join Household
                </Button>
            </div>

            {/* Create Household Button */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-dashed">
                        <Plus className="mr-2 h-4 w-4" /> Create New Household
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Household</DialogTitle>
                        <DialogDescription>Create a new space for your lists.</DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Household Name (e.g. My Home)"
                        value={newHouseholdName}
                        onChange={(e) => setNewHouseholdName(e.target.value)}
                    />
                    <DialogFooter>
                        <Button onClick={handleCreateHousehold} disabled={isCreating || !newHouseholdName.trim()}>
                            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Household List */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Your Households</h3>
                {households.map((household) => {
                    const isOwner = !household.ownerId || household.ownerId === userId
                    const memberCount = household._count.users

                    return (
                        <Card key={household.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">{household.name}</CardTitle>
                                            {isOwner ? (
                                                <Badge variant="default" className="text-[10px] px-1 py-0 h-5"><Shield className="w-3 h-3 mr-1" /> Owner</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5"><User className="w-3 h-3 mr-1" /> Member</Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-xs">
                                            ID: {household.id} • {memberCount} member{memberCount !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {isOwner && (
                                            <Dialog open={editingHousehold?.id === household.id} onOpenChange={(open) => {
                                                if (open) {
                                                    setEditingHousehold(household)
                                                    setRenameValue(household.name)
                                                } else {
                                                    setEditingHousehold(null)
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Rename Household</DialogTitle>
                                                    </DialogHeader>
                                                    <Input
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                    />
                                                    <DialogFooter>
                                                        <Button onClick={handleRenameHousehold} disabled={isRenaming || !renameValue.trim()}>
                                                            {isRenaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                            Save
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setInviteToken(null)
                                                setCopied(false)
                                                setActiveInviteHouseholdId(household.id)
                                                handleGenerateInvite(household.id)
                                            }}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite
                                        </Button>

                                        <Dialog
                                            open={activeInviteHouseholdId === household.id}
                                            onOpenChange={(open) => !open && setActiveInviteHouseholdId(null)}
                                        >
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Invite to {household.name}</DialogTitle>
                                                    <DialogDescription>
                                                        Share this code. Valid for {invitationTimeoutMinutes >= 60 ? `${Math.round(invitationTimeoutMinutes / 60)} hours` : `${invitationTimeoutMinutes} minutes`}, one-time use.
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
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-sm text-muted-foreground p-4">
                                                        Click "Invite" to generate code.
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>

                                        {/* Leave/Delete Button */}
                                        {isOwner ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={memberCount > 1}
                                                onClick={() => setHouseholdToDelete(household)}
                                                title={memberCount > 1 ? "Cannot delete household with other members" : "Delete Household"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setHouseholdToLeave(household)}
                                                title="Leave Household"
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    )
                })}
            </div>

            {/* Join Confirmation Dialog */}
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Join Household</DialogTitle>
                        <DialogDescription>
                            You are about to join <strong>{joinDetails?.householdName}</strong> owned by <strong>{joinDetails?.ownerName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowJoinDialog(false)}>Cancel</Button>
                        <Button onClick={handleConfirmJoin} disabled={isJoining}>
                            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm & Join
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Confirmation Dialog */}
            <Dialog open={!!householdToLeave} onOpenChange={(open) => !open && setHouseholdToLeave(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Household</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to leave <strong>{householdToLeave?.name}</strong>? You will need a new invitation to rejoin.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHouseholdToLeave(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleLeaveHousehold} disabled={isLeaving}>
                            {isLeaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!householdToDelete} onOpenChange={(open) => !open && setHouseholdToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Household</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{householdToDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHouseholdToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteHousehold} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

