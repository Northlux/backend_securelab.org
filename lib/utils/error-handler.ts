/**
 * Centralized error handling for server actions
 * Sanitizes error messages to prevent information leakage
 */

export interface ErrorResponse {
  error: string
  code: string
  details?: unknown
}

/**
 * Sanitize error message to prevent sensitive data leakage
 * Shows user-friendly messages instead of database errors
 */
export function sanitizeError(error: unknown): ErrorResponse {
  // Handle custom errors first
  if (error instanceof AuthError) {
    return {
      error: 'Authentication required. Please log in.',
      code: 'AUTH_REQUIRED',
    }
  }

  if (error instanceof ForbiddenError) {
    return {
      error:
        'You do not have permission to perform this action. Contact support if you believe this is incorrect.',
      code: 'FORBIDDEN',
    }
  }

  if (error instanceof RateLimitError) {
    return {
      error: error.message || 'Too many requests. Please wait before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
    }
  }

  if (error instanceof ValidationError) {
    return {
      error: error.message || 'Invalid input provided.',
      code: 'VALIDATION_ERROR',
    }
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as { code: string; message: string }
    if (err.code === '42501') {
      return {
        error: 'You do not have permission to access this resource.',
        code: 'PERMISSION_DENIED',
      }
    }
    if (err.code === 'PGRST116') {
      return {
        error: 'Resource not found.',
        code: 'NOT_FOUND',
      }
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Don't leak database error messages
    if (error.message.includes('relation') || error.message.includes('FOREIGN KEY')) {
      return {
        error: 'An operation could not be completed. Please verify your input.',
        code: 'OPERATION_FAILED',
      }
    }
    // Don't leak timeout/network errors
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return {
        error: 'A service is temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
      }
    }
  }

  // Default: don't expose unknown errors
  return {
    error: 'An unexpected error occurred. Our team has been notified. Please try again later.',
    code: 'INTERNAL_ERROR',
  }
}

/**
 * Custom error classes for better error handling
 */
export class AuthError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthError'
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Invalid input') {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource already exists') {
    super(message)
    this.name = 'ConflictError'
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

/**
 * Wrap server action with error handling
 * Automatically sanitizes errors and logs them
 */
export async function handleServerAction<T>(
  action: () => Promise<T>,
  actionName: string = 'unknown'
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    // Log the real error (for internal debugging)
    console.error(`[${actionName}] Error:`, error)

    // Sanitize and re-throw for client
    const sanitized = sanitizeError(error)
    throw new Error(JSON.stringify(sanitized))
  }
}

/**
 * Type guard to check if value is an error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Type guard to check if error is a specific type
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}
