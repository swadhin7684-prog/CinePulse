import { db, formatDoc, formatDocs } from '../config/firebase.js';

export const getCollection = (collectionName) => {
  return db.collection(collectionName);
};

export const findById = async (collectionName, id) => {
  if (!id) return null;
  const docRef = db.collection(collectionName).doc(id.toString());
  const snap = await docRef.get();
  return formatDoc(snap);
};

export const findOne = async (collectionName, filters = {}) => {
  let query = db.collection(collectionName);
  for (const [field, val] of Object.entries(filters)) {
    if (val !== undefined) {
      query = query.where(field, '==', val);
    }
  }
  const snap = await query.limit(1).get();
  const docs = formatDocs(snap);
  return docs.length > 0 ? docs[0] : null;
};

export const findAll = async (
  collectionName,
  filters = {},
  sorts = [],
  limit = null,
  offset = null
) => {
  let query = db.collection(collectionName);

  // Apply equality filters
  for (const [field, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null) {
      query = query.where(field, '==', val);
    }
  }

  // Apply sorting
  for (const sort of sorts) {
    if (typeof sort === 'string') {
      query = query.orderBy(sort, 'asc');
    } else if (sort.field) {
      query = query.orderBy(sort.field, sort.direction || 'asc');
    }
  }

  if (offset) {
    query = query.offset(offset);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const snap = await query.get();
  return formatDocs(snap);
};

export const count = async (collectionName, filters = {}) => {
  let query = db.collection(collectionName);
  for (const [field, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null) {
      query = query.where(field, '==', val);
    }
  }

  if (typeof query.count === 'function') {
    const agg = await query.count().get();
    return agg.data().count;
  }

  const snap = await query.get();
  return snap.size !== undefined ? snap.size : (snap.docs ? snap.docs.length : 0);
};

export const createDoc = async (collectionName, data, customId = null) => {
  const colRef = db.collection(collectionName);
  const now = new Date();
  const docData = {
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  let docRef;
  if (customId) {
    docRef = colRef.doc(customId.toString());
    await docRef.set(docData);
  } else {
    docRef = await colRef.add(docData);
  }

  const saved = await docRef.get();
  return formatDoc(saved);
};

export const updateDoc = async (collectionName, id, data) => {
  if (!id) return null;
  const docRef = db.collection(collectionName).doc(id.toString());
  const now = new Date();
  const updateData = {
    ...data,
    updatedAt: now,
  };

  await docRef.update(updateData);
  const updated = await docRef.get();
  return formatDoc(updated);
};

export const setDoc = async (collectionName, id, data, options = { merge: true }) => {
  if (!id) return null;
  const docRef = db.collection(collectionName).doc(id.toString());
  const now = new Date();
  const docData = {
    ...data,
    updatedAt: now,
  };
  await docRef.set(docData, options);
  const saved = await docRef.get();
  return formatDoc(saved);
};

export const deleteDoc = async (collectionName, id) => {
  if (!id) return false;
  const docRef = db.collection(collectionName).doc(id.toString());
  await docRef.delete();
  return true;
};

export const deleteWhere = async (collectionName, filters = {}) => {
  let query = db.collection(collectionName);
  for (const [field, val] of Object.entries(filters)) {
    if (val !== undefined) {
      query = query.where(field, '==', val);
    }
  }

  const snap = await query.get();
  const batch = db.batch();
  let count = 0;
  snap.forEach((doc) => {
    batch.delete(doc.ref || db.collection(collectionName).doc(doc.id));
    count++;
  });

  if (count > 0) {
    await batch.commit();
  }
  return count;
};

export const batchInsert = async (collectionName, items) => {
  if (!items || items.length === 0) return [];
  const colRef = db.collection(collectionName);
  const batch = db.batch();
  const now = new Date();
  const results = [];

  for (const item of items) {
    const docRef = item._id ? colRef.doc(item._id.toString()) : colRef.doc();
    const itemData = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: now,
    };
    batch.set(docRef, itemData);
    results.push({ _id: docRef.id, id: docRef.id, ...itemData });
  }

  await batch.commit();
  return results;
};
