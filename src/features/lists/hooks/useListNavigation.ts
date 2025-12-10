"use client"

import { useRef, useCallback } from "react"

interface UseListNavigationProps<T> {
    items: T[]
    onAdd: (index: number) => void
    onRemove: (index: number) => void
    onFocus: (index: number) => void
}

export function useListNavigation<T>({
    items,
    onAdd,
    onRemove,
    onFocus,
}: UseListNavigationProps<T>) {
    const itemRefs = useRef<(HTMLInputElement | null)[]>([])

    const registerRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
        itemRefs.current[index] = el
    }, [])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
            if (e.key === "Enter") {
                e.preventDefault()
                onAdd(index + 1)
            } else if (e.key === "Backspace" && e.currentTarget.value === "") {
                e.preventDefault()
                onRemove(index)
                // Focus previous
                if (index > 0) {
                    onFocus(index - 1)
                    // Ideally we'd focus the previous input and move cursor to end, 
                    // but for now just focusing is a good start.
                    setTimeout(() => {
                        itemRefs.current[index - 1]?.focus()
                    }, 0)
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                if (index > 0) {
                    itemRefs.current[index - 1]?.focus()
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                if (index < items.length - 1) {
                    itemRefs.current[index + 1]?.focus()
                }
            }
        },
        [items.length, onAdd, onRemove, onFocus]
    )

    return {
        registerRef,
        handleKeyDown,
        itemRefs,
    }
}
