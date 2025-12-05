
"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TripSummaryProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    missingItems: { id: string; name: string }[]
    isSubmitting: boolean
}

export function TripSummary({
    open,
    onOpenChange,
    onConfirm,
    missingItems,
    isSubmitting,
}: TripSummaryProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Trip Summary</DialogTitle>
                    <DialogDescription>
                        {missingItems.length > 0
                            ? `You have ${missingItems.length} unchecked items.`
                            : "All items checked! Ready to wrap up?"}
                    </DialogDescription>
                </DialogHeader>

                {missingItems.length > 0 && (
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <ul className="space-y-2">
                            {missingItems.map((item) => (
                                <li key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Resume Shopping
                    </Button>
                    <Button onClick={onConfirm} disabled={isSubmitting}>
                        {isSubmitting ? "Completing..." : "Complete Trip"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
