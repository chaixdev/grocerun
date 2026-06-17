import { toast } from "sonner"
import { ApiError } from "./api"

/**
 * Show an error toast that distinguishes network failures from server errors.
 *
 * TypeError (network down / offline) → generic offline message.
 * ApiError (server responded with error) → the server's message or fallback.
 * Everything else → fallback.
 */
export function networkAwareErrorToast(
  error: unknown,
  fallback: string,
): void {
  if (error instanceof TypeError) {
    toast.error(
      "No internet connection. Please try again when you're back online.",
    )
  } else if (error instanceof ApiError) {
    toast.error(error.message || fallback)
  } else {
    toast.error(fallback)
  }
}
