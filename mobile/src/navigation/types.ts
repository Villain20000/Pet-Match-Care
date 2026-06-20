/**
 * Shared navigation prop types so screens don't reach for `any`.
 *
 * `RootStackParamList` is the source of truth in AppNavigator.tsx; we
 * re-export the derived NativeStack navigation/prop types here so any
 * screen can import a typed `NativeStackScreenProps` without depending
 * on the navigator module (which would create a circular import for
 * screens that the navigator itself imports).
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

export type RootStackScreenProps<K extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, K>;

/** A loose navigation prop for screens that only call `navigate` to a
 *  handful of known destinations — keeps the call sites ergonomic. */
export type AppNavigation = RootStackScreenProps<keyof RootStackParamList>['navigation'];
