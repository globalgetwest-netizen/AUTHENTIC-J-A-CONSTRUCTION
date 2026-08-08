/**
 * Session storage for the mobile app.
 *
 * On native the token is kept in the Keychain/Keystore via `expo-secure-store`;
 * on web we fall back to `localStorage` (the self-hosted browser demo). Missing
 * or corrupt entries surface as `null` so auth never crashes the app.
 */
import { Platform } from 'react-native';
import type { Session } from './types';

const STORAGE_KEY = 'ajac.session.v1';

const isWeb = Platform.OS === 'web';

function readWeb(): Session | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeWeb(session: Session | null): void {
  try {
    if (session) globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(session));
    else globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — session simply won't persist this run */
  }
}

async function readNative(): Promise<Session | null> {
  try {
    const { getItemAsync } = await import('expo-secure-store');
    const raw = await getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

async function writeNative(session: Session | null): Promise<void> {
  try {
    const { setItemAsync, deleteItemAsync } = await import('expo-secure-store');
    if (session) await setItemAsync(STORAGE_KEY, JSON.stringify(session));
    else await deleteItemAsync(STORAGE_KEY);
  } catch {
    /* secure store unavailable */
  }
}

export async function loadSession(): Promise<Session | null> {
  return isWeb ? Promise.resolve(readWeb()) : readNative();
}

export async function persistSession(session: Session | null): Promise<void> {
  if (isWeb) writeWeb(session);
  else await writeNative(session);
}