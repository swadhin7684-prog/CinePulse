import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

dotenv.config();

let db = null;
let isLive = false;

// Helper to format a single document snapshot
export const formatDoc = (doc) => {
  if (!doc) return null;
  if (typeof doc.exists === 'boolean' && !doc.exists) return null;
  if (typeof doc.exists === 'function' && !doc.exists()) return null;

  const data = typeof doc.data === 'function' ? doc.data() : doc;
  if (!data) return null;

  const id = doc.id || data._id || data.id;

  // Convert Firestore Timestamps to ISO strings / Dates if needed
  const formatted = { ...data };
  for (const key of Object.keys(formatted)) {
    const val = formatted[key];
    if (val && typeof val.toDate === 'function') {
      formatted[key] = val.toDate();
    }
  }

  return {
    _id: id,
    id: id,
    ...formatted,
  };
};

// Helper to format an entire query snapshot
export const formatDocs = (snapshot) => {
  if (!snapshot) return [];
  const docs = snapshot.docs || snapshot;
  if (!Array.isArray(docs)) return [];
  return docs.map(formatDoc).filter(Boolean);
};

// Parse credentials from environment variables
function getFirebaseCredentials() {
  // Option 1: Full JSON string in FIREBASE_SERVICE_ACCOUNT
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      return cert(parsed);
    } catch (e) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }

  // Option 2: Individual environment variables (Vercel-recommended)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Correctly handle escaped newlines often passed in env variables
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    // Remove enclosing double quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  // Option 3: Standard GOOGLE_APPLICATION_CREDENTIALS file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return applicationDefault();
    } catch (e) {
      console.warn('[Firebase] applicationDefault failed:', e.message);
    }
  }

  // Option 4: Local serviceAccountKey.json file if placed in project directory
  const possiblePaths = [
    path.resolve('serviceAccountKey.json'),
    path.resolve('backend/serviceAccountKey.json'),
    path.resolve('backend/src/config/serviceAccountKey.json'),
  ];
  for (const keyPath of possiblePaths) {
    if (fs.existsSync(keyPath)) {
      try {
        const raw = fs.readFileSync(keyPath, 'utf8');
        console.log(`[Firebase] Loaded service account credentials from: ${keyPath}`);
        return cert(JSON.parse(raw));
      } catch (e) {
        console.warn(`[Firebase] Failed to load ${keyPath}:`, e.message);
      }
    }
  }

  return null;
}

// In-Memory Firestore Emulator for seamless local development without credentials
class MemoryQuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.empty = docs.length === 0;
    this.size = docs.length;
  }
  forEach(callback) {
    this.docs.forEach(callback);
  }
}

class MemoryDocSnapshot {
  constructor(id, data) {
    this.id = id;
    this._data = data ? JSON.parse(JSON.stringify(data)) : null;
    this.exists = !!data;
  }
  data() {
    return this._data ? JSON.parse(JSON.stringify(this._data)) : undefined;
  }
}

class MemoryDocRef {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id || crypto.randomUUID();
  }

  async get() {
    const data = this.collection.store.get(this.id) || null;
    return new MemoryDocSnapshot(this.id, data);
  }

  async set(data, options = {}) {
    let existing = this.collection.store.get(this.id) || {};
    let merged = options.merge ? { ...existing, ...data } : { ...data };
    merged.updatedAt = new Date();
    if (!existing.createdAt) merged.createdAt = new Date();
    this.collection.store.set(this.id, merged);
    return { writeTime: new Date() };
  }

  async update(data) {
    const existing = this.collection.store.get(this.id);
    if (!existing) {
      const err = new Error(`No document to update: ${this.id}`);
      err.code = 5; // NOT_FOUND
      throw err;
    }
    const merged = { ...existing, ...data, updatedAt: new Date() };
    this.collection.store.set(this.id, merged);
    return { writeTime: new Date() };
  }

  async delete() {
    this.collection.store.delete(this.id);
    return { writeTime: new Date() };
  }
}

class MemoryQuery {
  constructor(collection, filters = [], sorts = [], limitVal = null, offsetVal = null) {
    this.collection = collection;
    this.filters = filters;
    this.sorts = sorts;
    this.limitVal = limitVal;
    this.offsetVal = offsetVal;
  }

  where(field, op, val) {
    return new MemoryQuery(
      this.collection,
      [...this.filters, { field, op, val }],
      this.sorts,
      this.limitVal,
      this.offsetVal
    );
  }

  orderBy(field, direction = 'asc') {
    return new MemoryQuery(
      this.collection,
      this.filters,
      [...this.sorts, { field, direction }],
      this.limitVal,
      this.offsetVal
    );
  }

  limit(n) {
    return new MemoryQuery(
      this.collection,
      this.filters,
      this.sorts,
      n,
      this.offsetVal
    );
  }

  offset(n) {
    return new MemoryQuery(
      this.collection,
      this.filters,
      this.sorts,
      this.limitVal,
      n
    );
  }

  count() {
    return {
      get: async () => {
        const snap = await this.get();
        return { data: () => ({ count: snap.size }) };
      },
    };
  }

  async get() {
    let docs = [];
    for (const [id, data] of this.collection.store.entries()) {
      let match = true;
      for (const f of this.filters) {
        const itemVal = data[f.field];
        if (f.op === '==' && itemVal !== f.val) match = false;
        else if (f.op === '!=' && itemVal === f.val) match = false;
        else if (f.op === '>' && !(itemVal > f.val)) match = false;
        else if (f.op === '>=' && !(itemVal >= f.val)) match = false;
        else if (f.op === '<' && !(itemVal < f.val)) match = false;
        else if (f.op === '<=' && !(itemVal <= f.val)) match = false;
        else if (f.op === 'array-contains') {
          if (!Array.isArray(itemVal) || !itemVal.includes(f.val)) match = false;
        } else if (f.op === 'in') {
          if (!Array.isArray(f.val) || !f.val.includes(itemVal)) match = false;
        }
        if (!match) break;
      }
      if (match) {
        docs.push(new MemoryDocSnapshot(id, data));
      }
    }

    // Apply sorting
    for (const s of this.sorts) {
      docs.sort((a, b) => {
        const valA = a.data()[s.field];
        const valB = b.data()[s.field];
        if (valA === valB) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        const res = valA > valB ? 1 : -1;
        return s.direction === 'desc' ? -res : res;
      });
    }

    // Apply offset and limit
    if (this.offsetVal) {
      docs = docs.slice(this.offsetVal);
    }
    if (this.limitVal) {
      docs = docs.slice(0, this.limitVal);
    }

    return new MemoryQuerySnapshot(docs);
  }
}

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.store = new Map();
  }

  doc(id) {
    return new MemoryDocRef(this, id);
  }

  async add(data) {
    const id = crypto.randomUUID();
    const docRef = this.doc(id);
    await docRef.set(data);
    return docRef;
  }

  where(field, op, val) {
    return new MemoryQuery(this).where(field, op, val);
  }

  orderBy(field, direction) {
    return new MemoryQuery(this).orderBy(field, direction);
  }

  limit(n) {
    return new MemoryQuery(this).limit(n);
  }

  offset(n) {
    return new MemoryQuery(this).offset(n);
  }

  count() {
    return new MemoryQuery(this).count();
  }

  async get() {
    return new MemoryQuery(this).get();
  }
}

class MemoryWriteBatch {
  constructor() {
    this.ops = [];
  }

  set(docRef, data, options) {
    this.ops.push(() => docRef.set(data, options));
    return this;
  }

  update(docRef, data) {
    this.ops.push(() => docRef.update(data));
    return this;
  }

  delete(docRef) {
    this.ops.push(() => docRef.delete());
    return this;
  }

  async commit() {
    for (const op of this.ops) {
      await op();
    }
    return { writeResults: [] };
  }
}

class MemoryFirestore {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MemoryCollection(name));
    }
    return this.collections.get(name);
  }

  batch() {
    return new MemoryWriteBatch();
  }
}

// Global cached in-memory instance across re-runs in dev
if (!global.__cinepulse_memory_firestore) {
  global.__cinepulse_memory_firestore = new MemoryFirestore();
}

// Initialize Firestore DB (Singleton)
export const getDb = () => {
  if (db) return db;

  const credentials = getFirebaseCredentials();

  if (credentials) {
    try {
      const app = getApps().length === 0 ? initializeApp({ credential: credentials }) : getApps()[0];
      db = getFirestore(app);
      isLive = true;
      console.log('[Firebase] Connected to live Google Cloud Firestore successfully.');
      return db;
    } catch (err) {
      console.error('[Firebase] Failed to initialize live Firebase Admin SDK:', err.message);
      console.warn('[Firebase] Falling back to zero-config in-memory Firestore.');
    }
  } else {
    console.log('[Firebase] No Firebase credentials detected in environment.');
    console.log('[Firebase] Initialized zero-config in-memory Firestore engine for development.');
    console.log('[Firebase] To connect to production Firestore, configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
  }

  db = global.__cinepulse_memory_firestore;
  isLive = false;
  return db;
};

// Export active db instance
db = getDb();
export { db, isLive as isLiveFirestore };

// Export Firebase Admin Auth instance (for managing users in Firebase Authentication console)
export const getAdminAuth = () => {
  if (isLive) {
    try {
      return getAuth();
    } catch (e) {
      console.warn('[Firebase Auth] Failed to get Auth instance:', e.message);
      return null;
    }
  }
  return null;
};

// Health check utility function
export const checkFirestoreHealth = async () => {
  try {
    const firestore = getDb();
    // Test collection query with limit 1
    const testSnap = await firestore.collection('genres').limit(1).get();
    return {
      status: 'healthy',
      provider: 'Firebase Firestore',
      mode: isLive ? 'live-cloud' : 'in-memory-dev',
      accessible: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: 'degraded',
      provider: 'Firebase Firestore',
      mode: isLive ? 'live-cloud' : 'in-memory-dev',
      accessible: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
};
