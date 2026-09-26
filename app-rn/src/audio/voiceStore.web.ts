// Web preview: recordings are Blobs in IndexedDB (expo-file-system has no web backend).
const DB = 'tamil-train-voices';
const STORE = 'clips';

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const urls = new Map<string, string>();

export async function saveRecording(slot: string, key: string, tempUri: string): Promise<void> {
  const blob = await (await fetch(tempUri)).blob();
  await tx('readwrite', (s) => s.put(blob, `${slot}/${key}`));
  const old = urls.get(`${slot}/${key}`);
  if (old) URL.revokeObjectURL(old);
  urls.delete(`${slot}/${key}`);
}

export async function recordingUri(slot: string, key: string): Promise<string | null> {
  const k = `${slot}/${key}`;
  if (urls.has(k)) return urls.get(k)!;
  const blob = await tx<Blob | undefined>('readonly', (s) => s.get(k) as IDBRequest<Blob | undefined>);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(k, url);
  return url;
}

export async function deleteRecording(slot: string, key: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(`${slot}/${key}`));
  const url = urls.get(`${slot}/${key}`);
  if (url) URL.revokeObjectURL(url);
  urls.delete(`${slot}/${key}`);
}
