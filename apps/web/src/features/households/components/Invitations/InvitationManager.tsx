
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Loader2, UserPlus, UserMinus, Plus, Pencil, Shield, User, LogOut, Trash2, ChevronDown, ChevronRight } from "lucide-react"
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    useCreateInvitation,
    useGetInvitationDetails,
    useJoinHousehold,
    type SettingsHousehold,
} from "../../hooks/useInvitations"
import {
    useCreateHousehold,
    useRenameHousehold,
    useDeleteHousehold,
    useRemoveMember,
} from "../../hooks/useHouseholds"
import { useLeaveHousehold } from "../../hooks/useInvitations"
import {
    deriveHouseholdPermissions
} from "../../hooks/useHouseholdPermissions"

interface InvitationManagerProps {
    userId: string
    households: SettingsHousehold[]
    invitationTimeoutMinutes: number
}

export function InvitationManager({ userId, households, invitationTimeoutMinutes }: InvitationManagerProps) {
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [joinToken, setJoinToken] = useState("")
    const [copied, setCopied] = useState(false)

    // Join Confirmation State
    const [joinDetails, setJoinDetails] = useState<{ householdName: string, ownerName: string } | null>(null)
    const [showJoinDialog, setShowJoinDialog] = useState(false)

    // Create/Rename State
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [newHouseholdName, setNewHouseholdName] = useState("")
    const [editingHousehold, setEditingHousehold] = useState<{ id: string, name: string } | null>(null)
    const [renameValue, setRenameValue] = useState("")

    // Leave/Delete State
    const [householdToLeave, setHouseholdToLeave] = useState<{ id: string, name: string } | null>(null)
    const [householdToDelete, setHouseholdToDelete] = useState<{ id: string, name: string, memberCount: number } | null>(null)

    // Remove Member State
    const [memberToRemove, setMemberToRemove] = useState<{ householdId: string, householdName: string, memberUserId: string, memberName: string } | null>(null)

    // Invite Dialog State
    const [activeInviteHouseholdId, setActiveInviteHouseholdId] = useState<string | null>(null)

    // Expanded Household Cards
    const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set())

    function toggleHousehold(id: string) {
        setExpandedHouseholds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    // Mutations
    const createInvitation = useCreateInvitation()
    const getDetails = useGetInvitationDetails()
    const joinHousehold = useJoinHousehold()
    const createHousehold = useCreateHousehold()
    const renameHousehold = useRenameHousehold()
    const leaveHousehold = useLeaveHousehold()
    const deleteHousehold = useDeleteHousehold()
    const removeMember = useRemoveMember()

    function handleGenerateInvite(householdId: string) {
        createInvitation.mutate(
            { householdId },
            {
                onSuccess: (data) => {
                    setInviteToken(data.token)
                },
            },
        )
    }

    function handleInitiateJoin() {
        if (!joinToken.trim()) return
        getDetails.mutate(joinToken, {
            onSuccess: (data) => {
                setJoinDetails({
                    householdName: data.householdName,
                    ownerName: data.ownerName || "Unknown",
                })
                setShowJoinDialog(true)
            },
        })
    }

    function handleConfirmJoin() {
        joinHousehold.mutate(joinToken, {
            onSuccess: () => {
                setJoinToken("")
                setShowJoinDialog(false)
                setJoinDetails(null)
            },
        })
    }

    function handleCreateHousehold() {
        if (!newHouseholdName.trim()) return
        createHousehold.mutate(
            { name: newHouseholdName },
            {
                onSuccess: () => {
                    setShowCreateDialog(false)
                    setNewHouseholdName("")
                },
            },
        )
    }

    function handleRenameHousehold() {
        if (!editingHousehold || !renameValue.trim()) return
        renameHousehold.mutate(
            { householdId: editingHousehold.id, name: renameValue },
            {
                onSuccess: () => {
                    setEditingHousehold(null)
                },
            },
        )
    }

    function handleLeaveHousehold() {
        if (!householdToLeave) return
        leaveHousehold.mutate(householdToLeave.id, {
            onSuccess: () => {
                setHouseholdToLeave(null)
            },
        })
    }

    function handleDeleteHousehold() {
        if (!householdToDelete) return
        if (householdToDelete.memberCount > 1) {
            toast.error("Cannot delete household with other members", {
                description: "Remove or transfer the other members first.",
            })
            return
        }
        deleteHousehold.mutate(householdToDelete.id, {
            onSuccess: () => {
                setHouseholdToDelete(null)
            },
        })
    }

    function handleRemoveMember() {
        if (!memberToRemove) return
        removeMember.mutate(
            { householdId: memberToRemove.householdId, memberUserId: memberToRemove.memberUserId },
            {
                onSuccess: () => {
                    setMemberToRemove(null)
                },
            },
        )
    }

    function copyToClipboard() {
        if (inviteToken) {
            navigator.clipboard.writeText(inviteToken)
            setCopied(true)
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
                <Button onClick={handleInitiateJoin} disabled={getDetails.isPending || !joinToken.trim()}>
                    {getDetails.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                        <Button onClick={handleCreateHousehold} disabled={createHousehold.isPending || !newHouseholdName.trim()}>
                            {createHousehold.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Household List */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Your Households</h3>
                {households.map((household) => {
                    const perms = deriveHouseholdPermissions(
                        { ownerId: household.ownerId, memberCount: household._count.users },
                        userId,
                    )

                    return (
                        <Card key={household.id}>
                            <Collapsible open={expandedHouseholds.has(household.id)} onOpenChange={() => toggleHousehold(household.id)}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base">{household.name}</CardTitle>
                                                {perms.isOwner ? (
                                                    <Badge variant="default" className="text-[10px] px-1 py-0 h-5"><Shield className="w-3 h-3 mr-1" /> Owner</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5"><User className="w-3 h-3 mr-1" /> Member</Badge>
                                                )}
                                            </div>
                                            <CardDescription className="text-xs">
                                                {household._count.users} member{household._count.users !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        {perms.isOwner && (
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
                                                        <Button onClick={handleRenameHousehold} disabled={renameHousehold.isPending || !renameValue.trim()}>
                                                            {renameHousehold.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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

                                                {createInvitation.isPending ? (
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
                                                        Click &quot;Invite&quot; to generate code.
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>

                                        {/* Leave/Delete Button */}
                                        {perms.canLeave ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setHouseholdToLeave(household)}
                                                title="Leave Household"
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        ) : perms.canDelete ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setHouseholdToDelete({ id: household.id, name: household.name, memberCount: household._count.users })}
                                                title="Delete Household"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            /* Owner with other members — can't leave or delete, blocked on #9 */
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                disabled
                                                title="Transfer ownership before leaving or deleting"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div className="h-6 w-px bg-border mx-1" />
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                {expandedHouseholds.has(household.id)
                                                    ? <ChevronDown className="h-4 w-4" />
                                                    : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>
                                </CardHeader>
                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <div className="space-y-1">
                                            {[...household.members]
                                                .sort((a, b) => {
                                                    if (a.userId === household.ownerId) return -1
                                                    if (b.userId === household.ownerId) return 1
                                                    if (a.userId === userId) return -1
                                                    if (b.userId === userId) return 1
                                                    return a.name.localeCompare(b.name)
                                                })
                                                .map((member) => {
                                                const isOwner = member.userId === household.ownerId
                                                const isCurrentUser = member.userId === userId
                                                const displayName = member.name || member.userId.substring(0, 8)
                                                const initial = (member.name || member.userId).charAt(0).toUpperCase()
                                                return (
                                                    <div key={member.userId} className="flex items-center gap-3 py-1.5">
                                                        <div className="relative">
                                                            <Avatar className="h-8 w-8">
                                                                {member.image && <AvatarImage src={member.image} />}
                                                                <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                                                            </Avatar>
                                                            {isOwner && (
                                                                <Shield className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background p-0.5 text-primary" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm flex-1">
                                                            {displayName}
                                                            {isCurrentUser && <span className="text-muted-foreground ml-1">(You)</span>}
                                                        </span>
                                                        {perms.isOwner && !isCurrentUser && !isOwner && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => setMemberToRemove({
                                                                    householdId: household.id,
                                                                    householdName: household.name,
                                                                    memberUserId: member.userId,
                                                                    memberName: displayName,
                                                                })}
                                                                title="Remove Member"
                                                            >
                                                                <UserMinus className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
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
                        <Button onClick={handleConfirmJoin} disabled={joinHousehold.isPending}>
                            {joinHousehold.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                        <Button variant="destructive" onClick={handleLeaveHousehold} disabled={leaveHousehold.isPending}>
                            {leaveHousehold.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                            {householdToDelete?.memberCount && householdToDelete.memberCount > 1
                                ? <>You cannot delete <strong>{householdToDelete?.name}</strong> while it still has other members.</>
                                : <>Are you sure you want to delete <strong>{householdToDelete?.name}</strong>? This will permanently remove all associated stores, shopping lists, sections, and items. This action cannot be undone.</>}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHouseholdToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteHousehold} disabled={deleteHousehold.isPending || (householdToDelete?.memberCount ?? 0) > 1}>
                            {deleteHousehold.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Member Confirmation Dialog */}
            <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{memberToRemove?.memberName}</strong> from <strong>{memberToRemove?.householdName}</strong>? They will need a new invitation to rejoin.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMemberToRemove(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemoveMember} disabled={removeMember.isPending}>
                            {removeMember.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
