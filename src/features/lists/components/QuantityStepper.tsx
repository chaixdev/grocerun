"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import { QuantityPicker } from "./QuantityPicker"

interface QuantityStepperProps {
    value: number
    unit?: string | null
    plannedValue?: number
    onChange: (value: number, unit?: string) => void
    min?: number
}

export function QuantityStepper({
    value,
    unit,
    plannedValue,
    onChange,
    min = 0.1
}: QuantityStepperProps) {
    const formatQty = (qty: number, u?: string | null) => (
        <span>
            {qty}
            {u && <span className="text-[10px] text-muted-foreground ml-0.5 uppercase tracking-wide">{u}</span>}
        </span>
    )

    // Deviation Logic for Display
    // If plannedValue is present AND different from value, show deviation
    // Note: Use a small epsilon for float comparison if needed, but strict equality usually fine for user-entered numbers
    const hasDeviation = plannedValue !== undefined && plannedValue !== value

    return (
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5 shadow-sm border border-transparent hover:bg-muted/70 transition-colors" onClick={(e) => e.stopPropagation()}>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm"
                onClick={(e) => {
                    e.stopPropagation()
                    // Round up current to get clean ceiling, then subtract 1
                    // e.g. 1.5 -> ceil(1.5)=2 -> 2-1=1
                    const nextWhole = Math.ceil(value) - 1
                    const newValue = Math.max(min, nextWhole)
                    onChange(newValue, unit || undefined)
                }}
            >
                <Minus className="h-3 w-3" />
            </Button>

            <QuantityPicker
                quantity={value}
                unit={unit}
                onChange={onChange}
            >
                <button className="px-2 min-w-[3rem] text-center text-sm font-medium hover:text-primary transition-colors">
                    {hasDeviation ? (
                        <span className="flex items-center gap-1">
                            <span className="line-through opacity-50 text-[10px]">{plannedValue}</span>
                            {formatQty(value, unit)}
                        </span>
                    ) : (
                        formatQty(value, unit)
                    )}
                </button>
            </QuantityPicker>

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm"
                onClick={(e) => {
                    e.stopPropagation()
                    // Round down current to get clean floor, then add 1
                    // e.g. 1.5 -> floor(1.5)=1 -> 1+1=2
                    const nextWhole = Math.floor(value) + 1
                    onChange(nextWhole, unit || undefined)
                }}
            >
                <Plus className="h-3 w-3" />
            </Button>
        </div>
    )
}
