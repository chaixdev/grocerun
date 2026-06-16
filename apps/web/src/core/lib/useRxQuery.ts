import { useEffect, useRef, useState } from "react"
import { getRxDb } from "@/core/rxdb"
import type { GrocerunDatabase } from "@/core/rxdb"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseRxQueryResult<T> = {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  isError: boolean
}

export type UseRxQueryConfig<T> = {
  /**
   * Set up reactive subscriptions and define how to produce the output
   * value from current database state.
   *
   * Called inside useEffect after `getRxDb()` resolves.  Must be stable —
   * capture changing values through `deps` so the effect re-runs when they
   * change.
   *
   * @param db           The initialised RxDB database.
   * @param triggerUpdate  Callback provided by the hook.  Wire subscription
   *                       callbacks to this — it will invoke `compute()` and
   *                       then update React state with the result.
   * @returns cleanup functions (called on unmount or deps change) and a
   *          `compute` function that reads fresh data from the DB.
   */
  setup: (db: GrocerunDatabase, triggerUpdate: () => void) => Promise<{
    /** Called on unmount or when deps invalidate. */
    subscriptions: Array<() => void>
    /** Recompute the output from current database state.
     *  Pure — must not call setState or trigger side effects.  The hook
     *  wraps this with state management internally. */
    compute: () => Promise<T>
  }>
  /**
   * One-time initialisation that runs before setup (e.g. trigger
   * background resync).  Optional.
   */
  init?: () => Promise<void>
  /** Error message used when the setup promise rejects or compute throws. */
  errorMsg?: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Centralised query hook for RxDB subscriptions.
 *
 * Eliminates the 35–85-line boilerplate pattern repeated across every
 * query hook:
 *
 *   getRxDb() → cancelled flag → subscribe → compute → error handling → cleanup
 *
 * @example
 * ```ts
 * const { data, isLoading } = useRxQuery<Household[]>(
 *   {
 *     setup: async (db, triggerUpdate) => {
 *       const compute = async () => {
 *         const docs = await db.households.find().exec()
 *         return docs.map(doc => ({ id: doc.id, name: doc.name }))
 *       }
 *       const sub = db.households.find().$.subscribe(() => void triggerUpdate())
 *       return { subscriptions: [() => sub.unsubscribe()], compute }
 *     },
 *   },
 *   [],
 * )
 * ```
 */
export function useRxQuery<T>(
  config: UseRxQueryConfig<T>,
  deps: unknown[],
): UseRxQueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const consecutiveErrorCount = useRef(0)

  // Accumulate cleanup functions and a retry counter for subscription errors.
  // Transient IndexedDB hiccups are retried silently; persistent errors
  // (N consecutive failures) are surfaced so the UI can show feedback
  // instead of rendering stale data indefinitely.
  const SUBSCRIPTION_ERROR_THRESHOLD = 5
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => {
    const { setup, init, errorMsg } = configRef.current

    let cancelled = false
    // accumulate cleanup functions to invoke on teardown
    let cleanups: Array<() => void> = []

    const run = async () => {
      try {
        const db = await getRxDb()
        if (cancelled) return

        await init?.()
        if (cancelled) return

        // The hook provides triggerUpdate — a safe wrapper around the
        // user's compute function that handles state updates.  Subscription
        // callbacks call triggerUpdate instead of compute directly so that
        // every subscription fire produces a React state update.
        let userCompute: (() => Promise<T>) | null = null

        const triggerUpdate = async () => {
          if (!userCompute) return
          try {
            const result = await userCompute()
            consecutiveErrorCount.current = 0
            if (!cancelled) {
              setData(result)
              setIsLoading(false)
              setError(null)
            }
          } catch (err) {
            consecutiveErrorCount.current++
            if (consecutiveErrorCount.current >= SUBSCRIPTION_ERROR_THRESHOLD) {
              if (!cancelled) {
                setError(err instanceof Error ? err : new Error(errorMsg ?? "Subscription error"))
                setIsLoading(false)
              }
            }
          }
        }

        const { subscriptions, compute: rawCompute } = await setup(db, triggerUpdate)
        if (cancelled) {
          subscriptions.forEach((fn) => { fn() })
          return
        }

        userCompute = rawCompute
        cleanups = subscriptions

        // Initial computation (after subscriptions are wired so any
        // concurrent writes are covered by the subscription).
        await triggerUpdate()
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error(errorMsg ?? "Failed to load data"),
          )
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
      cleanups.forEach((fn) => { fn() })
    }
    // deps intentionally excluded — see function documentation
  }, deps)

  return { data, isLoading, error, isError: !!error }
}
