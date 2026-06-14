
import { useEffect, useState } from "react"
import { DiagnosticsOverlay } from "@/components/diagnostics-overlay"

const STORAGE_KEY = "grocerun-diagnostics"

export function DiagnosticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(localStorage.getItem(STORAGE_KEY) === "true")

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setEnabled(e.newValue === "true")
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  if (!enabled) return null
  return <DiagnosticsOverlay />
}
