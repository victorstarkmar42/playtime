/**
 * "Mis dibujos": pictures a grown-up added to colour (photos of drawings, images from the device).
 *
 * They live only on this device, in IndexedDB (photos are too big for localStorage). Screens use
 * `picStore`, never IndexedDB directly, so a cloud store (one private folder per account) can
 * replace or wrap it later without touching the screens.
 */

export interface MyPic {
  id: string;
  name: string;
  /** The picture fitted to the 1200×900 board, white around it (JPEG). */
  src: Blob;
  /** Line level chosen when it was added ("menos / más líneas"). */
  level: number;
  /** Small line preview for lists (JPEG data URL). */
  thumb: string;
  createdAt: number;
}

export interface PicStore {
  list(): Promise<MyPic[]>;
  get(id: string): Promise<MyPic | undefined>;
  put(p: MyPic): Promise<void>;
  remove(id: string): Promise<void>;
}

export const MAX_PICS = 30;
const DB = 'playhour-pics';
const STORE = 'pics';

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

/** Memory fallback when IndexedDB is not available (private windows in some browsers). */
const memory = new Map<string, MyPic>();

export const localPicStore: PicStore = {
  async list() {
    try {
      const all = await tx<MyPic[]>('readonly', (s) => s.getAll() as IDBRequest<MyPic[]>);
      return all.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [...memory.values()].sort((a, b) => b.createdAt - a.createdAt);
    }
  },
  async get(id) {
    try {
      return await tx<MyPic | undefined>('readonly', (s) => s.get(id) as IDBRequest<MyPic | undefined>);
    } catch {
      return memory.get(id);
    }
  },
  async put(p) {
    try {
      await tx('readwrite', (s) => s.put(p));
    } catch {
      memory.set(p.id, p);
    }
  },
  async remove(id) {
    memory.delete(id);
    try {
      await tx('readwrite', (s) => s.delete(id));
    } catch {
      /* nothing stored */
    }
  },
};

/** The store the app uses. */
export const picStore: PicStore = localPicStore;

export const newPicId = (): string => `pic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
