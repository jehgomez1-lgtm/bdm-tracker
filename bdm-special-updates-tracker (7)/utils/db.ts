
import { MasterRecord, HouseholdMember } from '../types';

const DB_NAME = 'BDM_Database';
const STORE_MASTER = 'master_records';
const STORE_HOUSEHOLD = 'household_records';
const DB_VERSION = 2;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MASTER)) {
        db.createObjectStore(STORE_MASTER, { keyPath: 'hhid' });
      }
      if (!db.objectStoreNames.contains(STORE_HOUSEHOLD)) {
        const hhStore = db.createObjectStore(STORE_HOUSEHOLD, { keyPath: 'entryId' });
        hhStore.createIndex('hhid', 'hhid', { unique: false });
        hhStore.createIndex('lastName', 'lastName', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveMasterRecords = async (records: MasterRecord[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_MASTER, 'readwrite');
    const store = transaction.objectStore(STORE_MASTER);
    store.clear();
    records.forEach(record => store.put(record));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getMasterRecords = async (): Promise<MasterRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_MASTER, 'readonly');
    const store = transaction.objectStore(STORE_MASTER);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const countHouseholdRecords = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve) => {
    if (!db.objectStoreNames.contains(STORE_HOUSEHOLD)) return resolve(0);
    const transaction = db.transaction(STORE_HOUSEHOLD, 'readonly');
    const store = transaction.objectStore(STORE_HOUSEHOLD);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(0);
  });
};

export const saveHouseholdRecordsInBatches = async (records: HouseholdMember[], onProgress?: (p: number) => void): Promise<void> => {
  const db = await openDB();
  const total = records.length;
  const BATCH_SIZE = 5000;
  
  const clearTx = db.transaction(STORE_HOUSEHOLD, 'readwrite');
  clearTx.objectStore(STORE_HOUSEHOLD).clear();
  await new Promise(r => clearTx.oncomplete = r);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const tx = db.transaction(STORE_HOUSEHOLD, 'readwrite');
    const store = tx.objectStore(STORE_HOUSEHOLD);
    
    batch.forEach(record => {
      if (!record.entryId) record.entryId = `${record.hhid}-${record.firstName}-${i}`;
      store.put(record);
    });

    await new Promise((resolve) => {
      tx.oncomplete = resolve;
      tx.onerror = () => resolve(null);
    });

    if (onProgress) onProgress(Math.round(((i + batch.length) / total) * 100));
  }
};

export const searchHouseholdRecords = async (query: string): Promise<HouseholdMember[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    if (!db.objectStoreNames.contains(STORE_HOUSEHOLD)) return resolve([]);
    const transaction = db.transaction(STORE_HOUSEHOLD, 'readonly');
    const store = transaction.objectStore(STORE_HOUSEHOLD);
    const results: HouseholdMember[] = [];
    const q = query.toUpperCase();
    
    const request = store.openCursor();
    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor && results.length < 50) {
        const val = cursor.value as HouseholdMember;
        if (val.hhid.includes(q) || val.lastName.toUpperCase().includes(q) || val.firstName.toUpperCase().includes(q)) {
          results.push(val);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });
};

export const getHouseholdMembersByHHID = async (hhid: string): Promise<HouseholdMember[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_HOUSEHOLD, 'readonly');
    const store = transaction.objectStore(STORE_HOUSEHOLD);
    const index = store.index('hhid');
    const request = index.getAll(hhid);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });
};
