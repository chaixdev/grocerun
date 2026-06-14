import { useCallback, useState } from "react"

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

  const mutateAsync = useCallback(
    async (variables: TVariables, callbacks?: MutateCallbacks<TData, TVariables>) => {
      setIsPending(true)
      try {
        const data = await options.mutationFn(variables)
        await options.onSuccess?.(data, variables)
        await callbacks?.onSuccess?.(data, variables)
        return data
      } catch (error) {
        await options.onError?.(error, variables)
        await callbacks?.onError?.(error, variables)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [options],
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
