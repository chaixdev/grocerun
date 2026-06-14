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
