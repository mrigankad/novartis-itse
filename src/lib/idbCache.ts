type StoredValue<T> = {
  key: string;
  value: T;
  updatedAt: number;
};

const DB_NAME = "novartis-itse";
const DB_VERSION = 1;
const STORE_NAME = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function idbGet<T>(key: string): Promise<StoredValue<T> | null> {
  try {
    const result = await withStore<StoredValue<T> | undefined>("readonly", (store) => store.get(key));
    return result ?? null;
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const payload: StoredValue<T> = { key, value, updatedAt: Date.now() };
  try {
    await withStore<IDBValidKey>("readwrite", (store) => store.put(payload));
  } catch {
    return;
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    await withStore<undefined>("readwrite", (store) => store.delete(key));
  } catch {
    return;
  }
}

