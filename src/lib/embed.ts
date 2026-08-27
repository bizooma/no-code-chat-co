/**
 * The public origin customers' embed snippets must point at.
 *
 * Deliberately NOT the current page origin: the snippet is pasted onto other
 * people's websites, so it must reference a publicly reachable host, not
 * whatever origin the dashboard happened to be open on (Lovable preview,
 * a Netlify deploy preview, localhost). Falls back to the current page origin
 * only when the env var is unset, so local development still works.
 */
export const EMBED_ORIGIN =
  import.meta.env.VITE_PUBLIC_APP_ORIGIN || window.location.origin;
