"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { searchItems, getTopItemsForStore } from "@/actions/item"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuggestedItem {
    id: string
    name: string
    sectionId: string | null
    defaultUnit: string | null
    purchaseCount: number
}

interface ItemAutocompleteProps {
    storeId: string
    value: string
    onChange: (value: string) => void
    onSelect: (item: SuggestedItem) => void
    onSubmit: () => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function ItemAutocomplete({
    storeId,
    value,
    onChange,
    onSelect,
    onSubmit,
    placeholder = "Add item...",
    disabled = false,
    className,
}: ItemAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<SuggestedItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const lastQueryRef = useRef<string | null>(null) // Track last fetched query to prevent duplicate fetches

    // Fetch suggestions based on query
    const fetchSuggestions = useCallback(async (query: string) => {
        // Skip if we already fetched for this exact query
        if (lastQueryRef.current === query) return
        lastQueryRef.current = query

        setIsLoading(true)
        try {
            if (query.trim()) {
                const items = await searchItems({ storeId, query: query.trim() })
                setSuggestions(items)
            } else {
                // Empty query: show top items
                const items = await getTopItemsForStore({ storeId, limit: 5, threshold: 1 })
                setSuggestions(items)
            }
        } catch (error) {
            console.error("Autocomplete error:", error)
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }, [storeId])

    // Debounced search - only triggers on value change, not on showSuggestions change
    useEffect(() => {
        if (!showSuggestions) return

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value)
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, fetchSuggestions]) // Intentionally omit showSuggestions to prevent double-fetch on focus

    // Load top items on focus (immediate, not debounced)
    const handleFocus = () => {
        setShowSuggestions(true)
        setHighlightedIndex(-1)
        // Only fetch if we haven't fetched yet or query changed
        if (lastQueryRef.current !== value) {
            fetchSuggestions(value)
        }
    }

    // Handle blur with delay for click to register
    const handleBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false)
            setHighlightedIndex(-1)
        }, 150)
    }

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === "Enter") {
                e.preventDefault()
                onSubmit()
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
                break
            case "Enter":
                e.preventDefault()
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    handleSelectItem(suggestions[highlightedIndex])
                } else {
                    onSubmit()
                }
                break
            case "Escape":
                setShowSuggestions(false)
                setHighlightedIndex(-1)
                break
        }
    }

    const handleSelectItem = (item: SuggestedItem) => {
        onSelect(item)
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        inputRef.current?.focus()
    }

    return (
        <div className={cn("relative", className)}>
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full h-11 text-base border-transparent bg-muted/50 focus:bg-background transition-colors"
                autoComplete="off"
            />

            {/* Inline Suggestions - Mobile-first design */}
            {showSuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Searching...</span>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <ul className="py-1">
                            {suggestions.map((item, index) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectItem(item)}
                                        className={cn(
                                            // Mobile-friendly: min 44px touch target
                                            "w-full min-h-[44px] px-3 py-2 text-left flex items-center justify-between gap-2",
                                            "hover:bg-accent transition-colors",
                                            highlightedIndex === index && "bg-accent"
                                        )}
                                    >
                                        <span className="font-medium truncate">
                                            {item.name}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {item.defaultUnit && (
                                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {item.defaultUnit}
                                                </span>
                                            )}
                                            {item.purchaseCount > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    ×{item.purchaseCount}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : value.trim() ? (
                        <div className="py-3 px-3 text-sm text-muted-foreground text-center">
                            No matches — press Enter to add &quot;{value.trim()}&quot;
                        </div>
                    ) : (
                        <div className="py-3 px-3 text-sm text-muted-foreground text-center">
                            Start typing to search
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
