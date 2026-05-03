/**
 * IndexedDB-backed video blob store.
 *
 * Why IndexedDB and not localStorage: video files run from a few MB to
 * tens of MB; localStorage caps at ~5MB and can't hold Blobs natively.
 * IndexedDB easily handles hundreds of MB and stores Blobs directly so
 * we don't pay the base64 expansion tax.
 *
 * Public API:
 *   - putVideo(file) → "idb://video-{id}"  // store and return a ref
 *   - getVideoUrl(ref) → string             // create object URL for playback
 *   - deleteVideo(ref) → void               // delete blob from store
 *   - listVideos() → VideoRecord[]          // for the admin cleanup panel
 *   - clearAllVideos() → void               // wipe everything
 *
 * Refs use the synthetic scheme "idb://video-{id}" so they can flow
 * through Job.video alongside http(s):// URLs without breaking existing
 * code. JobCard / jobMedia.ts decode the scheme on demand.
 */

const DB_NAME = "swiply-videos";
const DB_VERSION = 1;
const STORE = "videos";

export const VIDEO_REF_PREFIX = "idb://video-";

export interface VideoRecord {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

let openPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (openPromise) return openPromise;
  openPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
  return openPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDb().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function refToId(ref: string): number | null {
  if (!ref.startsWith(VIDEO_REF_PREFIX)) return null;
  const n = parseInt(ref.slice(VIDEO_REF_PREFIX.length), 10);
  return Number.isFinite(n) ? n : null;
}

export function isVideoRef(ref: string | null | undefined): boolean {
  return !!ref && ref.startsWith(VIDEO_REF_PREFIX);
}

export async function putVideo(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("動画ファイル（video/*）を指定してください");
  }
  const store = await tx("readwrite");
  return new Promise<string>((resolve, reject) => {
    const req = store.add({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      blob: file,
      createdAt: new Date().toISOString(),
    });
    req.onsuccess = () => resolve(`${VIDEO_REF_PREFIX}${req.result as number}`);
    req.onerror = () => reject(req.error ?? new Error("動画の保存に失敗しました"));
  });
}

/**
 * Returns an object URL for the stored blob, or null if the ref is invalid
 * or the entry no longer exists. Callers MUST URL.revokeObjectURL when
 * done to release memory.
 */
export async function getVideoUrl(ref: string): Promise<string | null> {
  const id = refToId(ref);
  if (id === null) return null;
  const store = await tx("readonly");
  return new Promise<string | null>((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => {
      const row = req.result as { blob?: Blob } | undefined;
      if (!row?.blob) return resolve(null);
      resolve(URL.createObjectURL(row.blob));
    };
    req.onerror = () => resolve(null);
  });
}

export async function deleteVideo(ref: string): Promise<void> {
  const id = refToId(ref);
  if (id === null) return;
  const store = await tx("readwrite");
  return new Promise<void>((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("削除に失敗しました"));
  });
}

export async function listVideos(): Promise<VideoRecord[]> {
  const store = await tx("readonly");
  return new Promise<VideoRecord[]>((resolve) => {
    const req = store.openCursor();
    const out: VideoRecord[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
        return;
      }
      const v = cursor.value as VideoRecord;
      out.push({
        id: v.id,
        filename: v.filename,
        mimeType: v.mimeType,
        size: v.size,
        createdAt: v.createdAt,
      });
      cursor.continue();
    };
    req.onerror = () => resolve(out);
  });
}

export async function clearAllVideos(): Promise<void> {
  const store = await tx("readwrite");
  return new Promise<void>((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("削除に失敗しました"));
  });
}

export function refToDisplayId(ref: string): string {
  const id = refToId(ref);
  return id === null ? ref : `#${id}`;
}
