/**
 * Server-side secure logger
 *
 * SECURITY: Logs are written to server-side only (not exposed to client/browser)
 * Prevents information disclosure of sensitive database/system errors
 *
 * OWASP A09: Logging & Monitoring - proper error handling
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Log message server-side only
 * Safe to use in server actions - logs never reach client
 */
export function serverLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  context: string,
  message: string,
  details?: Record<string, unknown>
): void {
  // In production, this would send to centralized logging (e.g., Sentry, DataDog)
  // For now, only log in development to avoid exposing in production builds
  if (isDevelopment) {
    console[level](`[${context}] ${message}`, details || '')
  }

  // TODO: Send to external logging service in production
  // Example: const entry: LogEntry = { ... };  await logger.log(entry)
}

/**
 * Get generic error message for client (no sensitive details)
 */
export function getClientErrorMessage(operation: string): string {
  const messages: Record<string, string> = {
    'fetch': 'Failed to retrieve data',
    'update': 'Failed to update',
    'delete': 'Failed to delete',
    'create': 'Failed to create',
    'auth': 'Authentication failed',
    'validate': 'Invalid input provided',
  }

  return messages[operation] || 'An error occurred'
}

/**
 * Handle Supabase errors securely
 * Logs full error server-side only, returns generic message to client
 *
 * SECURITY: Full error details logged server-side but never exposed to client
 * Prevents information disclosure (OWASP A09)
 */
export function handleDatabaseError(
  context: string,
  error: unknown,
  operation: 'fetch' | 'update' | 'delete' | 'create'
): string {
  // Log full details server-side only
  if (error instanceof Error) {
    serverLog('error', context, `${operation} failed: ${error.message}`, {
      error: error.message,
      stack: isDevelopment ? error.stack : undefined,
    })
  } else {
    serverLog('error', context, `${operation} failed with unknown error`, { error })
  }

  // Return generic message to client - never expose real error
  return getClientErrorMessage(operation)
}
