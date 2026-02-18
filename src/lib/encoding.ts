import type { LotteryResult } from './lottery'

/**
 * Encode lottery results into a URL-safe base64 string.
 */
export function encodeResults(result: LotteryResult): string {
  const json = JSON.stringify(result)
  return btoa(encodeURIComponent(json))
}

/**
 * Decode lottery results from a base64 string.
 */
export function decodeResults(encoded: string): LotteryResult {
  const json = decodeURIComponent(atob(encoded))
  return JSON.parse(json) as LotteryResult
}

/**
 * Compute SHA-256 hash of the lottery results JSON.
 */
export async function hashResults(result: LotteryResult): Promise<string> {
  const json = JSON.stringify(result)
  const encoder = new TextEncoder()
  const data = encoder.encode(json)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Build a shareable reveal URL from lottery results.
 */
export function buildRevealUrl(result: LotteryResult): string {
  const encoded = encodeResults(result)
  const base = window.location.origin + window.location.pathname
  return `${base}#/reveal/${encoded}`
}
