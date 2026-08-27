export interface FlowButton {
  text: string;
  next_key?: string;
  url?: string;
}

/**
 * Returns a safe absolute https URL, or null when the value is unusable.
 * Validated at render time as well as in the editor: `buttons` is jsonb and
 * rows can be written outside the editor.
 */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  // Reject protocol-relative URLs ("//evil.com")
  if (raw.startsWith('//')) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (!parsed.hostname) return null;
  return parsed.toString();
}

export function isSafeExternalUrl(value: unknown): boolean {
  return safeExternalUrl(value) !== null;
}

/** Normalizes a stored button: a button has either next_key or url, never both. */
export function normalizeFlowButton(button: any): FlowButton {
  const text = typeof button?.text === 'string' ? button.text : '';
  const url = safeExternalUrl(button?.url);
  if (url) return { text, url };
  return { text, next_key: typeof button?.next_key === 'string' ? button.next_key : '' };
}
