import { useMutation } from "@tanstack/react-query"
import { api } from "@/core/lib/api"
import { toast } from "sonner"

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
