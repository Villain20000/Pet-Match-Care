/**
 * Local type shim for `expo-splash-screen`.
 *
 * `expo-splash-screen` is referenced in App.tsx but isn't part of the
 * mobile `package.json`. The boot flow wraps the import in a try/catch
 * so runtime failures are silent — this declaration only exists to keep
 * the TypeScript compiler happy.
 *
 * The shape mirrors the parts of `expo-splash-screen`'s public API that
 * App.tsx actually calls (`preventAutoHideAsync()`, `hideAsync().catch()`).
 * Anything more sophisticated should add the real `expo-splash-screen`
 * dependency instead of relying on this shim.
 */
declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<void>;
  export function hideAsync(): Promise<void>;
}
