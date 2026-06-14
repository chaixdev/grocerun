import { useCallback, useRef, useState } from "react"

type MutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: unknown, variables: TVariables) => void | Promise<void>
}

type MutateCallbacks<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: unknown, variables: TVariables) => void | Promise<void>
}

/**
 * Lightweight mutation hook (no TanStack Query dependency).
 *
 * ## API convention
 * - **`mutate(variables, callbacks?)`** — fire-and-forget. Use when you
 *   don't need to await the result and can handle side effects via
 *   callbacks (e.g., toast on success, navigation on error).
 * - **`mutateAsync(variables, callbacks?)`** — awaitable. Use when the
 *   calling code must wait for the mutation to complete before continuing
 *   (e.g., chaining multiple mutations, optimistic-lock retries).
 *
 * Both methods accept optional `MutateCallbacks` in addition to the
 * `onSuccess`/`onError` configured at hook creation time.
 */
export function useMutation<TData, TVariables = void>(options: MutationOptions<TData, TVariables>) {
  const [isPending, setIsPending] = useState(false)
  // Keep options in a ref so mutateAsync/mutate are stable across renders.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const mutateAsync = useCallback(
    async (variables: TVariables, callbacks?: MutateCallbacks<TData, TVariables>) => {
      setIsPending(true)
      try {
        const data = await optionsRef.current.mutationFn(variables)
        await optionsRef.current.onSuccess?.(data, variables)
        await callbacks?.onSuccess?.(data, variables)
        return data
      } catch (error) {
        await optionsRef.current.onError?.(error, variables)
        await callbacks?.onError?.(error, variables)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [], // stable — reads latest options via ref
  )

  const mutate = useCallback(
    (variables: TVariables, callbacks?: MutateCallbacks<TData, TVariables>) => {
      void mutateAsync(variables, callbacks)
    },
    [mutateAsync],
  )

  return {
    mutate,
    mutateAsync,
    isPending,
  }
}
