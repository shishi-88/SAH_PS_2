import type { AppSnapshot } from "@/domain/types";

const DB_NAME = "sahayak-path";
const DB_VERSION = 1;
const VAULT = "vault";
const KEYSTORE = "keystore";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VAULT)) db.createObjectStore(VAULT);
      if (!db.objectStoreNames.contains(KEYSTORE)) db.createObjectStore(KEYSTORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbSet(store: string, key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

async function getOrCreateDeviceKey(): Promise<CryptoKey | null> {
  if (!globalThis.crypto?.subtle) return null;
  const existing = await idbGet<CryptoKey>(KEYSTORE, "device-aes");
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  await idbSet(KEYSTORE, "device-aes", key);
  return key;
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export const STORAGE_NOTE_ENCRYPTED =
  "Saved on this phone. Records are wrapped with a device key (AES-GCM). This is not a password vault — anyone who can unlock the phone and open this app can read them.";

export const STORAGE_NOTE_PLAIN =
  "Saved on this phone using ordinary browser storage. Web Crypto was not available, so the file is not encrypted. Rely on the device lock.";

export async function loadSnapshot(): Promise<AppSnapshot | null> {
  const row = await idbGet<{
    mode: "encrypted" | "plain";
    iv?: string;
    data: string;
  }>(VAULT, "snapshot");
  if (!row) return null;
  if (row.mode === "plain") {
    return JSON.parse(row.data) as AppSnapshot;
  }
  const key = await getOrCreateDeviceKey();
  if (!key || !row.iv) return null;
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64ToBuf(row.iv)) },
    key,
    b64ToBuf(row.data),
  );
  const text = new TextDecoder().decode(plain);
  return JSON.parse(text) as AppSnapshot;
}

export async function saveSnapshot(snapshot: AppSnapshot): Promise<string> {
  const key = await getOrCreateDeviceKey();
  const json = JSON.stringify(snapshot);
  if (!key) {
    await idbSet(VAULT, "snapshot", { mode: "plain", data: json });
    return STORAGE_NOTE_PLAIN;
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(json),
  );
  await idbSet(VAULT, "snapshot", {
    mode: "encrypted",
    iv: bufToB64(iv.buffer),
    data: bufToB64(cipher),
  });
  return STORAGE_NOTE_ENCRYPTED;
}

export async function clearSnapshot(): Promise<void> {
  await idbSet(VAULT, "snapshot", undefined);
}
