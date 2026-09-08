/**
 * IndexedDB wrapper for storing uploaded files and parsed datasets
 * Provides full persistence across page refreshes and navigation
 */

const DB_NAME = "CyberPredictDB";
const DB_VERSION = 1;
const FILE_STORE = "uploadedFiles";
const DATASET_STORE = "datasets";

interface StoredFile {
  id: string;
  filename: string;
  blob: Blob;
  uploadedAt: string;
}

interface StoredDataset {
  id: string;
  filename: string;
  rows: number;
  columns: string[];
  preview: Record<string, string>[];
  mapping: Record<string, string>;
  hosts: number;
  edges: number;
  timeStart?: string;
  timeEnd?: string;
  fileSize: string;
  uploadedAt: string;
}

class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        console.warn("IndexedDB not available");
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          db.createObjectStore(FILE_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(DATASET_STORE)) {
          db.createObjectStore(DATASET_STORE, { keyPath: "id" });
        }
      };
    });
  }

  async saveFile(file: File): Promise<string> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storedFile: StoredFile = {
      id,
      filename: file.name,
      blob: file,
      uploadedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([FILE_STORE], "readwrite");
      const store = tx.objectStore(FILE_STORE);
      const request = store.put(storedFile);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(id: string): Promise<File | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([FILE_STORE], "readonly");
      const store = tx.objectStore(FILE_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        if (result) {
          // Convert Blob back to File
          const file = new File([result.blob], result.filename, {
            type: result.blob.type,
          });
          resolve(file);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveDataset(dataset: Omit<StoredDataset, "uploadedAt">): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const storedDataset: StoredDataset = {
      ...dataset,
      uploadedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([DATASET_STORE], "readwrite");
      const store = tx.objectStore(DATASET_STORE);
      const request = store.put(storedDataset);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDataset(id: string): Promise<StoredDataset | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([DATASET_STORE], "readonly");
      const store = tx.objectStore(DATASET_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([FILE_STORE, DATASET_STORE], "readwrite");
      const fileStore = tx.objectStore(FILE_STORE);
      const datasetStore = tx.objectStore(DATASET_STORE);

      fileStore.clear();
      datasetStore.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Singleton instance
export const storage = new StorageManager();

// Helper to check if storage is available
export function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && !!window.indexedDB;
}
