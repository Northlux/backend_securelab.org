/**
 * Input sanitization utilities
 * Prevents SQL injection, XSS, and other injection attacks
 */

/**
 * Sanitize search query to prevent SQL injection
 * Removes special SQL characters but preserves alphanumeric and common chars
 */
export function sanitizeSearchQuery(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Truncate to max length
  let sanitized = input.slice(0, maxLength)

  // Remove SQL special characters that could be used for injection
  // Allow: alphanumeric, spaces, hyphens, underscores, dots, commas, parentheses
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,()]/g, '')

  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Trim
  return sanitized.trim()
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes directory separators and special characters
 */
export function sanitizeFilename(
  filename: string,
  maxLength: number = 255
): string {
  if (!filename || typeof filename !== 'string') {
    return 'file'
  }

  // Remove path separators and special characters
  let sanitized = filename.replace(/[^a-zA-Z0-9._\-]/g, '')

  // Ensure it doesn't look like a path
  sanitized = sanitized.replace(/\.\.\//g, '')
  sanitized = sanitized.replace(/\.\./g, '')

  // Truncate
  sanitized = sanitized.slice(0, maxLength)

  // Ensure not empty
  return sanitized || 'file'
}

/**
 * Validate URL format (basic)
 * Returns true if URL looks valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize URL by ensuring it's valid and removing fragments
 */
export function sanitizeUrl(url: string): string | null {
  if (!isValidUrl(url)) {
    return null
  }

  try {
    const parsed = new URL(url)
    // Remove fragment (#) which could be used for injection
    const parts = parsed.href.split('#')
    return parts[0] || null
  } catch {
    return null
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // Basic email regex - not exhaustive but good enough
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.toLowerCase())
}

/**
 * Sanitize email to lowercase and trim
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }
  return email.toLowerCase().trim()
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false
  }

  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize JSON by parsing and re-stringifying (removes malformed data)
 */
export function sanitizeJson(data: unknown, maxDepth: number = 10): unknown {
  if (maxDepth <= 0) {
    return null
  }

  if (data === null || data === undefined) {
    return null
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item, maxDepth - 1))
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '')
      if (cleanKey.length > 0) {
        sanitized[cleanKey] = sanitizeJson(value, maxDepth - 1)
      }
    }
    return sanitized
  }

  return null
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInteger(
  value: unknown,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = Number(value)

  if (Number.isInteger(num) && num >= min && num <= max) {
    return num
  }

  return null
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumeric(
  value: unknown,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = Number(value)

  if (!Number.isNaN(num) && num >= min && num <= max) {
    return num
  }

  return null
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate enum value
 */
export function isValidEnum<T>(value: unknown, enumValues: T[]): value is T {
  return enumValues.includes(value as T)
}

/**
 * Sanitize string to prevent XSS
 * Escapes HTML special characters
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return text.replace(/[&<>"']/g, char => map[char] ?? char)
}

/**
 * Truncate string to max length without breaking words
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str || typeof str !== 'string' || maxLength < 1) {
    return ''
  }

  if (str.length <= maxLength) {
    return str
  }

  // Find last space before max length
  let truncated = str.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.7) {
    // If last space is in last 30%, break there
    return truncated.slice(0, lastSpace) + '...'
  }

  // Otherwise just truncate at max length
  return truncated + '...'
}

/**
 * Validate array of strings
 */
export function sanitizeStringArray(
  arr: unknown,
  maxLength: number = 100,
  maxItems: number = 100
): string[] {
  if (!Array.isArray(arr)) {
    return []
  }

  return arr
    .filter(item => typeof item === 'string')
    .slice(0, maxItems)
    .map(item => item.slice(0, maxLength).trim())
    .filter(item => item.length > 0)
}

/**
 * Validate array of UUIDs
 */
export function sanitizeUuidArray(arr: unknown, maxItems: number = 100): string[] {
  if (!Array.isArray(arr)) {
    return []
  }

  return arr
    .filter(item => typeof item === 'string' && isValidUuid(item))
    .slice(0, maxItems)
}
