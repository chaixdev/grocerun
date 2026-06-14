"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

interface QuantityPickerProps {
    quantity: number
    unit?: string | null
    onChange: (quantity: number, unit?: string) => void
    children: React.ReactNode
}

export function QuantityPicker({
    quantity,
    unit,
    onChange,
    children
}: QuantityPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [manualQty, setManualQty] = useState(quantity.toString())
    const [manualUnit, setManualUnit] = useState(unit || "")

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        const qty = parseFloat(manualQty)
        if (!isNaN(qty) && qty > 0) {
            onChange(qty, manualUnit.trim() || undefined)
            setIsOpen(false)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            if (open) {
                setManualQty(quantity.toString())
                setManualUnit(unit || "")
            }
            setIsOpen(open)
        }}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="center" side="top" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <h4 className="font-medium text-sm text-center">Update Quantity</h4>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="qty-picker" className="sr-only">Quantity</Label>
                            <Input
                                id="qty-picker"
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={manualQty}
                                onChange={(e) => setManualQty(e.target.value)}
                                className="h-9 text-center border-transparent bg-muted/50 focus:bg-background transition-colors"
                                placeholder="Qty"
                                autoFocus
                            />
                        </div>
                        <div className="w-20">
                            <Label htmlFor="unit-picker" className="sr-only">Unit</Label>
                            <Input
                                id="unit-picker"
                                value={manualUnit}
                                onChange={(e) => setManualUnit(e.target.value)}
                                className="h-9 text-center border-transparent bg-muted/50 focus:bg-background transition-colors"
                                placeholder="Unit"
                            />
                        </div>
                    </div>
                    <Button type="submit" size="sm" className="w-full h-8">
                        Apply
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    )
}
