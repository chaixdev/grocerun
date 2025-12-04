"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

interface Household {
    id: string
    name: string
}

export function HouseholdSelect({ households }: { households: Household[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const householdId = searchParams.get("householdId") || households[0]?.id

    function onSelect(value: string) {
        router.push(`?householdId=${value}`)
    }

    if (households.length === 0) return null

    return (
        <Select value={householdId} onValueChange={onSelect}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select household" />
            </SelectTrigger>
            <SelectContent>
                {households.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                        {h.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
