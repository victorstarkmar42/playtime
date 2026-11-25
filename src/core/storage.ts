/**
 * Todo lo que la app guarda pasa por aquí. Hoy es localStorage; cuando llegue la sincronización en
 * la nube (Firebase), basta con escuchar `onWrite` y usar `exportData`/`importData` con el mismo
 * formato, sin tocar las pantallas.
 */

/** Keys that hold the child's data, with the shape version they were written with. */
export const DATA_KEYS = {
  settings: 'pym-settings',
  progress: 'pym-progress',
  game: 'pym-game',
  paintDone: 'pym-pn-done',
  parentQuiz: 'pym-parentquiz',
  profile: 'pym-profile',
} as const;
export type DataName = keyof typeof DATA_KEYS;

/** Device-only keys that never go into a backup or the cloud. */
export const LOCAL_KEYS = { installDismissed: 'pym-install-dismissed' } as const;

export const SCHEMA_VERSION = 1;
const SCHEMA_KEY = 'pym-schema';

type WriteListener = (key: string, value: unknown) => void;
const writeListeners = new Set<WriteListener>();

/** Called after every successful write or removal (value `null`): the future sync layer hooks in here. */
export function onWrite(l: WriteListener): () => void {
  writeListeners.add(l);
  return () => writeListeners.delete(l);
}

/** localStorage can be missing or throw (private mode, blocked storage, tests): never let that break the game. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  } catch {
    return; /* storage unavailable: keep playing without persistence */
  }
  writeListeners.forEach((l) => l(key, value));
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
  writeListeners.forEach((l) => l(key, null));
}

/** A local, anonymous profile id. It never leaves the device today; later it links the child to a family. */
export interface Profile {
  id: string;
  createdAt: string;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
}

export function getProfile(): Profile {
  const p = readJSON<Partial<Profile> | null>(DATA_KEYS.profile, null);
  if (p && typeof p.id === 'string' && typeof p.createdAt === 'string') return { id: p.id, createdAt: p.createdAt };
  const fresh = { id: newId(), createdAt: new Date().toISOString() };
  writeJSON(DATA_KEYS.profile, fresh);
  return fresh;
}

export interface Backup {
  app: 'playhour';
  schema: number;
  exportedAt: string;
  data: Partial<Record<DataName, unknown>>;
}

/** Everything about the child except the album (pictures stay on the device). */
export function exportData(): Backup {
  getProfile();
  const data: Backup['data'] = {};
  for (const [name, key] of Object.entries(DATA_KEYS) as [DataName, string][]) {
    const v = readJSON<unknown>(key, undefined);
    if (v !== undefined) data[name] = v;
  }
  return { app: 'playhour', schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

/** Checks a backup file. Returns the reason in Spanish if it can't be used. */
export function checkBackup(raw: unknown): { ok: true; backup: Backup } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'El archivo no es una copia de PlayHour.' };
  const b = raw as Partial<Backup>;
  if (b.app !== 'playhour' || !b.data || typeof b.data !== 'object') return { ok: false, error: 'El archivo no es una copia de PlayHour.' };
  if (typeof b.schema !== 'number' || b.schema > SCHEMA_VERSION) return { ok: false, error: 'La copia es de una versión más nueva de la app. Actualiza primero.' };
  return { ok: true, backup: b as Backup };
}

/** Replaces the child's data with the backup. The app must reload afterwards to read it. */
export function importData(b: Backup): void {
  for (const [name, key] of Object.entries(DATA_KEYS) as [DataName, string][]) {
    if (name in b.data) writeJSON(key, b.data[name]);
    else removeKey(key);
  }
}
