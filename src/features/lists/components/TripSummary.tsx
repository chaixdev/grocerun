
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
    missingItems: {
        id: string
        name: string
        quantity: number
        unit: string | null
    }[]
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
                            ? `You have ${missingItems.length} missing or incomplete items.`
                            : "All items checked! Ready to wrap up?"}
                    </DialogDescription>
                </DialogHeader>

                {missingItems.length > 0 && (
                    <ScrollArea className="h-[200px] w-full rounded-lg bg-muted/30 p-4">
                        <ul className="space-y-3">
                            {missingItems.map((item) => (
                                <li key={item.id} className="text-sm font-medium text-foreground flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                                    <span className="flex-1">{item.name}</span>
                                    {(item.quantity !== 1 || item.unit) && (
                                        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border shadow-sm">
                                            {item.quantity} {item.unit}
                                        </span>
                                    )}
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
