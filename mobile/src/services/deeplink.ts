/**
 * Deep-link helper. Parses incoming `petmatchcare://` URLs and exposes
 * a tiny in-memory queue that lets screens consume the latest link once
 * they're mounted. Cold-start URLs come through `Linking.getInitialURL`;
 * runtime URLs come through `Linking.addEventListener('url', ...)`.
 */
import { Linking } from 'react-native';

export type DeepLinkKind = 'verify-email' | 'reset-password' | 'application' | 'unknown';

export interface ParsedDeepLink {
  kind: DeepLinkKind;
  path: string;
  params: Record<string, string>;
}

export const parseDeepLink = (url: string): ParsedDeepLink => {
  // URL looks like: petmatchcare://verify-email?token=eyJ...
  try {
    const u = new URL(url);
    const host = u.host || u.pathname.replace(/^\/+/, '').split('/')[0] || '';
    const kind = (['verify-email', 'reset-password', 'application'] as DeepLinkKind[]).includes(
      host as DeepLinkKind,
    )
      ? (host as DeepLinkKind)
      : 'unknown';
    const params: Record<string, string> = {};
    u.searchParams.forEach((v, k) => (params[k] = v));
    return { kind, path: u.pathname || '/', params };
  } catch {
    return { kind: 'unknown', path: url, params: {} };
  }
};

// Module-scoped pending link. The BootGate + Settings / Verify / Reset
// screens consume this on mount.
let pendingLink: ParsedDeepLink | null = null;
const subscribers = new Set<(link: ParsedDeepLink) => void>();

export const setPendingDeepLink = (link: ParsedDeepLink | null) => {
  pendingLink = link;
  if (link) {
    subscribers.forEach((cb) => cb(link));
    pendingLink = null;
  }
};

export const consumePendingDeepLink = (): ParsedDeepLink | null => {
  const out = pendingLink;
  pendingLink = null;
  return out;
};

export const subscribeDeepLinks = (cb: (link: ParsedDeepLink) => void) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

export const installLinkingListeners = (): (() => void) => {
  const handler = (event: { url: string }) => setPendingDeepLink(parseDeepLink(event.url));
  const sub = Linking.addEventListener('url', handler);
  void Linking.getInitialURL().then((url) => {
    if (url) setPendingDeepLink(parseDeepLink(url));
  });
  return () => sub.remove();
};
