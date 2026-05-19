/**
 * Resolves the public origin for Stripe redirect URLs.
 *
 * In production: prefers NEXT_PUBLIC_APP_URL if set, so redirects go to the
 * canonical domain (useful behind proxies / multiple hostnames).
 *
 * In development: always derives the origin from the incoming request, so
 * the redirect comes back to whatever host the user is browsing from —
 * including LAN IPs when testing on a phone.
 */
export function getRedirectOrigin(request: Request): string {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return new URL(request.url).origin;
}
