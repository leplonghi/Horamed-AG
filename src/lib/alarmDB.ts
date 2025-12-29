/**
 * IndexedDB wrapper for alarm management
 * Provides persistent storage for scheduled alarms
 */

const DB_NAME = 'horamed-alarms';
const DB_VERSION = 1;
const STORE_NAME = 'alarms';

export interface Alarm {
  id: string;
  title: string;
  message?: string;
  scheduledAt: string; // ISO date string
  enabled: boolean;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'hourly';
  sound: boolean;
  vibrate: boolean;
  silent: boolean;
  requireInteraction: boolean;
  url?: string;
  action?: string;
  createdAt: string;
  lastTriggered?: string;
  category?: 'medication' | 'appointment' | 'reminder' | 'custom';
  metadata?: Record<string, any>;
}

class AlarmDB {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[AlarmDB] Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('scheduledAt', 'scheduledAt', { unique: false });
          store.createIndex('enabled', 'enabled', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('recurrence', 'recurrence', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  async getAll(): Promise<Alarm[]> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getById(id: string): Promise<Alarm | undefined> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getEnabled(): Promise<Alarm[]> {
    const alarms = await this.getAll();
    return alarms.filter(alarm => alarm.enabled);
  }

  async getByCategory(category: Alarm['category']): Promise<Alarm[]> {
    const alarms = await this.getAll();
    return alarms.filter(alarm => alarm.category === category);
  }

  async save(alarm: Alarm): Promise<string> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(alarm);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(alarm.id);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async toggleEnabled(id: string): Promise<Alarm | undefined> {
    const alarm = await this.getById(id);
    if (!alarm) return undefined;

    alarm.enabled = !alarm.enabled;
    await this.save(alarm);
    return alarm;
  }

  async deleteAll(): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPending(): Promise<Alarm[]> {
    const alarms = await this.getEnabled();
    const now = new Date().toISOString();
    return alarms.filter(alarm => alarm.scheduledAt > now);
  }

  async getOverdue(): Promise<Alarm[]> {
    const alarms = await this.getEnabled();
    const now = new Date().toISOString();
    return alarms.filter(alarm => alarm.scheduledAt <= now);
  }
}

export const alarmDB = new AlarmDB();
