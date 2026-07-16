import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'boxit-offline';
const VERSION = 1;

export const ACTIVE_STORE = 'active';
export const QUEUE_STORE = 'queue';
export const DOC_KEY = 'doc';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB no disponible'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ACTIVE_STORE)) {
          db.createObjectStore(ACTIVE_STORE); // key-value: DOC_KEY → Workout
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'seq', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}
