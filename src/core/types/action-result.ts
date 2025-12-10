/**
 * Standard response type for server actions.
 * All actions should return this type for consistent error handling.
 */
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string }

/**
 * Create a success result with data.
 */
export function success<T>(data: T): ActionResult<T> {
    return { success: true, data }
}

/**
 * Create a failure result with an error message.
 */
export function failure(error: string): ActionResult<never> {
    return { success: false, error }
}

/**
 * Type guard to check if result is successful.
 */
export function isSuccess<T>(result: ActionResult<T>): result is { success: true; data: T } {
    return result.success === true
}
