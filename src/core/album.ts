import type { CharKey } from './types';

export interface AlbumItem {
  id: string;
  key: CharKey;
  kind: 'reveal' | 'colored';
  /** JPEG data URL. */
  img: string;
  createdAt: number;
}

const DB = 'punto-y-magia'; // storage name kept from the app's first name, so albums survive the rename
const STORE = 'album';
const MAX_ITEMS = 40;
let memory: AlbumItem[] = [];

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(req.result);
        t.onerror = () => reject(t.error);
      }),
  );
}

export async function listAlbum(): Promise<AlbumItem[]> {
  try {
    const all = await tx<AlbumItem[]>('readonly', (s) => s.getAll() as IDBRequest<AlbumItem[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [...memory].sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function addToAlbum(key: CharKey, kind: AlbumItem['kind'], source: HTMLCanvasElement): Promise<void> {
  const t = document.createElement('canvas');
  t.width = 480;
  t.height = 360;
  const c = t.getContext('2d');
  if (!c) return;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, t.width, t.height);
  c.drawImage(source, 0, 0, t.width, t.height);
  const item: AlbumItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key, kind, img: t.toDataURL('image/jpeg', 0.82), createdAt: Date.now() };
  try {
    await tx('readwrite', (s) => s.put(item));
    const all = await listAlbum();
    for (const old of all.slice(MAX_ITEMS)) await tx('readwrite', (s) => s.delete(old.id));
  } catch {
    memory = [item, ...memory].slice(0, MAX_ITEMS);
  }
}

export async function clearAlbum(): Promise<void> {
  memory = [];
  try {
    await tx('readwrite', (s) => s.clear());
  } catch {
    /* nothing stored */
  }
}
