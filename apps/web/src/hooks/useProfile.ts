import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { toast } from "sonner"
import { useEffect, useState } from "react"

export interface CurrentUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export function useCurrentUser() {
  const [data, setData] = useState<CurrentUser | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    api.get<CurrentUser>("/users/me")
      .then((user) => {
        if (cancelled) return
        setData(user)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error("Failed to load current user"))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, isLoading, error, isError: !!error }
}

// ----- Mutations -----

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: { name?: string; image?: string }) =>
      api.patch("/users/me", data),
    onSuccess: () => {
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      })
    },
    onError: () => {
      toast.error("Failed to update profile")
    },
  })
}
