import { openDB } from 'idb';

const DB_NAME = 'inventory_db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Items store
      if (!db.objectStoreNames.contains('items')) {
        const itemStore = db.createObjectStore('items', { keyPath: 'id' });
        itemStore.createIndex('serial_number', 'serial_number', { unique: true });
        itemStore.createIndex('status', 'status');
      }
      
      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const addItemToDB = async (item) => {
  const db = await initDB();
  await db.put('items', item);
};

export const getItemsFromDB = async () => {
  const db = await initDB();
  return db.getAll('items');
};

export const getItemBySerialFromDB = async (serialNumber) => {
  const db = await initDB();
  const index = db.transaction('items').store.index('serial_number');
  return index.get(serialNumber);
};

export const updateItemInDB = async (item) => {
  const db = await initDB();
  await db.put('items', item);
};

export const deleteItemFromDB = async (id) => {
  const db = await initDB();
  await db.delete('items', id);
};

export const addToSyncQueue = async (action) => {
  const db = await initDB();
  await db.add('sync_queue', action);
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll('sync_queue');
};

export const clearSyncQueue = async () => {
  const db = await initDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  await tx.store.clear();
};