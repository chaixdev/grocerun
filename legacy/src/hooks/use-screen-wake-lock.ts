"use client"

import { useCallback, useEffect, useState } from "react"


export function useScreenWakeLock(enabled: boolean = true) {
    const [isSupported, setIsSupported] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)

    useEffect(() => {
        setIsSupported("wakeLock" in navigator)
    }, [])

    const requestLock = useCallback(async () => {
        if (!("wakeLock" in navigator)) return

        try {
            const lock = await navigator.wakeLock.request("screen")
            setWakeLock(lock)
            setIsLocked(true)

            lock.addEventListener("release", () => {
                setIsLocked(false)
                setWakeLock(null)
            })
            console.log("Wake Lock acquired")
        } catch (err: any) {
            console.error(`Wake Lock request failed: ${err.name}, ${err.message}`)
            // Don't toast on error, might be noisy if frequent
        }
    }, [])

    const releaseLock = useCallback(async () => {
        if (wakeLock) {
            try {
                await wakeLock.release()
                setWakeLock(null)
            } catch (err: any) {
                console.error(`Wake Lock release failed: ${err.name}, ${err.message}`)
            }
        }
    }, [wakeLock])

    useEffect(() => {
        // If enabled and supported, try to request
        if (enabled && isSupported && !wakeLock) {
            requestLock()
        }

        // Cleanup on disable/unmount
        return () => {
            if (wakeLock) releaseLock()
        }
    }, [enabled, isSupported, requestLock, releaseLock, wakeLock])

    // Re-acquire lock when page becomes visible again (system might release it on background)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && enabled && isSupported && !isLocked) {
                await requestLock()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [enabled, isSupported, isLocked, requestLock])

    return { isSupported, isLocked, release: releaseLock, request: requestLock }
}
