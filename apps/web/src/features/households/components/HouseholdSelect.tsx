
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useNavigate, useSearch } from "@tanstack/react-router"
import type { Household } from "@/features/households/hooks/useHouseholds"

export function HouseholdSelect({ households }: { households: Household[] }) {
    const navigate = useNavigate({ from: '/stores' })
    const search = useSearch({ from: '/stores' })
    const householdId = search.householdId || households[0]?.id

    function onSelect(value: string) {
        navigate({ search: (prev) => ({ ...prev, householdId: value }) })
    }

    if (households.length === 0) return null

    return (
        <Select value={householdId} onValueChange={onSelect}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select household" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
                {households.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                        {h.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
