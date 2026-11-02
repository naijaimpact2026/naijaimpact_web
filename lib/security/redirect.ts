/**
 * Security utility for redirect sanitization.
 * Protects against Open Redirect (CWE-601) and phishing attacks by ensuring
 * all client and server redirects stay strictly within the current application origin.
 */

/**
 * Validates and sanitizes a redirect target URL.
 * Rejects:
 * - External absolute URLs (e.g., https://attacker.com, http://phishing.site)
 * - Protocol-relative URLs (e.g., //attacker.com)
 * - Scheme-based payloads (e.g., javascript:alert(1), data:text/html, etc.)
 * - Malformed strings with carriage returns, newlines, or backslashes
 *
 * @param url The raw redirect URL/path parameter
 * @param fallback The safe internal destination to fall back to (default: '/app/feed')
 * @returns A safe relative path starting with '/'
 */
export function sanitizeRedirectPath(
  url: string | null | undefined,
  fallback: string = '/app/feed'
): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // Reject empty string or inputs containing newlines / carriage returns (CRLF injection)
  if (!trimmed || /[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  // Must begin with a single '/' and NOT '//' (protocol-relative) or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject URLs containing a protocol scheme before any query parameters (e.g., /javascript:... or /https:...)
  const pathWithoutQuery = trimmed.split('?')[0].split('#')[0];
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(pathWithoutQuery)) {
    return fallback;
  }

  return trimmed;
}
