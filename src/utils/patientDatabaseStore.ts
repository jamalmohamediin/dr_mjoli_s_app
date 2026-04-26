import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { isLocalPatientAttachment, stripLocalPatientAttachments } from "@/utils/localPatientAttachmentStore";
import {
  applyPatientDeletedState,
  createEmptyPatientDatabaseCache,
  normalizePatientDatabaseCache,
  PatientAttachment,
  PatientDatabaseCache,
  PatientRecord,
  PatientSummary,
  removePatientRecordFromCache,
  removePatientsFromCache,
  upsertPatientRecordInCache,
} from "@/utils/patientRecords";

const PATIENTS_CACHE_KEY = "patients_cache_v1";
const PATIENT_RECORDS_CACHE_KEY = "patient_records_cache_v1";
const PATIENT_SYNC_QUEUE_KEY = "patient_sync_queue_v1";
const PENDING_RECORD_DELETE_IDS_KEY = "patient_pending_record_delete_ids_v1";
const PATIENT_RECORDS_LOCAL_CACHE_DISABLED_KEY = "patient_records_local_cache_disabled_v1";

type SyncQueueItem =
  | {
      id: string;
      type: "upsertPatientRecord";
      createdAt: string;
      patient: PatientSummary;
      record: PatientRecord;
    }
  | {
      id: string;
      type: "setPatientDeletedState";
      createdAt: string;
      patientId: string;
      deletedAt: string | null;
      recordIds: string[];
    }
  | {
      id: string;
      type: "permanentlyDeletePatients";
      createdAt: string;
      patientIds: string[];
      recordIds: string[];
    }
  | {
      id: string;
      type: "setPatientAttachments";
      createdAt: string;
      patientId: string;
      attachments: PatientAttachment[];
    }
  | {
      id: string;
      type: "deletePatientRecord";
      createdAt: string;
      patient: PatientSummary | null;
      recordId: string;
    };

let inMemoryPatientCache: PatientDatabaseCache = createEmptyPatientDatabaseCache();
let inMemoryPatientSyncQueue: SyncQueueItem[] = [];
let inMemoryPendingRecordDeleteIds: string[] = [];
type PatientDbRuntimeState = {
  localStorageWriteBlockedKeys: Set<string>;
  localStorageWriteErrorShownKeys: Set<string>;
  localStorageParseErrorShownKeys: Set<string>;
  hasShownPatientCacheQuotaWarning: boolean;
  hasShownPatientSyncQueueQuotaWarning: boolean;
  disablePatientRecordsLocalCacheWrite: boolean;
};

const globalScope = globalThis as {
  __patientDbRuntimeState?: PatientDbRuntimeState;
};

const runtimeState =
  globalScope.__patientDbRuntimeState ||
  (globalScope.__patientDbRuntimeState = {
    localStorageWriteBlockedKeys: new Set<string>(),
    localStorageWriteErrorShownKeys: new Set<string>(),
    localStorageParseErrorShownKeys: new Set<string>(),
    hasShownPatientCacheQuotaWarning: false,
    hasShownPatientSyncQueueQuotaWarning: false,
    disablePatientRecordsLocalCacheWrite: false,
  });

const localStorageWriteBlockedKeys = runtimeState.localStorageWriteBlockedKeys;
const localStorageWriteErrorShownKeys = runtimeState.localStorageWriteErrorShownKeys;
const localStorageParseErrorShownKeys = runtimeState.localStorageParseErrorShownKeys;
let hasShownPatientCacheQuotaWarning = runtimeState.hasShownPatientCacheQuotaWarning;
let hasShownPatientSyncQueueQuotaWarning = runtimeState.hasShownPatientSyncQueueQuotaWarning;
let nextPatientSyncAttemptAt = 0;
const PATIENT_SYNC_RETRY_MS = 15000;

const parseStoredJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    if (!localStorageParseErrorShownKeys.has(key)) {
      localStorageParseErrorShownKeys.add(key);
      console.error(`Failed to parse local cache for ${key}`, error);
    }
    return fallback;
  }
};

const writeStoredJson = (key: string, value: any) => {
  if (typeof window === "undefined") {
    return false;
  }

  if (
    key === PATIENT_RECORDS_CACHE_KEY &&
    (runtimeState.disablePatientRecordsLocalCacheWrite ||
      sessionStorage.getItem(PATIENT_RECORDS_LOCAL_CACHE_DISABLED_KEY) === "1")
  ) {
    return false;
  }

  if (localStorageWriteBlockedKeys.has(key)) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    localStorageWriteBlockedKeys.add(key);
    if (key === PATIENT_RECORDS_CACHE_KEY) {
      runtimeState.disablePatientRecordsLocalCacheWrite = true;
      sessionStorage.setItem(PATIENT_RECORDS_LOCAL_CACHE_DISABLED_KEY, "1");
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore remove errors
    }
    if (!localStorageWriteErrorShownKeys.has(key)) {
      localStorageWriteErrorShownKeys.add(key);
      console.error(`Failed to write local cache for ${key}`, error);
    }
    return false;
  }
};

const toSerializable = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const createQueueId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const sanitizeId = (value: unknown) => String(value ?? "").trim();
const isValidFirestoreDocId = (value: string) => value.length > 0 && !value.includes("/");

const sanitizeIdList = (values: unknown) => {
  if (!Array.isArray(values)) {
    return [] as string[];
  }

  const dedupedIds = new Set<string>();
  values.forEach((value) => {
    const normalizedId = sanitizeId(value);
    if (isValidFirestoreDocId(normalizedId)) {
      dedupedIds.add(normalizedId);
    }
  });

  return Array.from(dedupedIds);
};

const loadPendingRecordDeleteIds = () => {
  const storedIds = parseStoredJson(
    PENDING_RECORD_DELETE_IDS_KEY,
    null as string[] | null,
  );
  if (Array.isArray(storedIds)) {
    inMemoryPendingRecordDeleteIds = sanitizeIdList(storedIds);
    return inMemoryPendingRecordDeleteIds;
  }

  inMemoryPendingRecordDeleteIds = sanitizeIdList(inMemoryPendingRecordDeleteIds);
  return inMemoryPendingRecordDeleteIds;
};

const savePendingRecordDeleteIds = (recordIds: string[]) => {
  inMemoryPendingRecordDeleteIds = sanitizeIdList(recordIds);
  writeStoredJson(PENDING_RECORD_DELETE_IDS_KEY, inMemoryPendingRecordDeleteIds);
};

const addPendingRecordDeleteId = (recordId: string) => {
  const safeRecordId = sanitizeId(recordId);
  if (!isValidFirestoreDocId(safeRecordId)) {
    return;
  }

  const ids = loadPendingRecordDeleteIds();
  if (ids.includes(safeRecordId)) {
    return;
  }

  savePendingRecordDeleteIds([...ids, safeRecordId]);
};

const removePendingRecordDeleteId = (recordId: string) => {
  const safeRecordId = sanitizeId(recordId);
  if (!safeRecordId) {
    return;
  }

  const ids = loadPendingRecordDeleteIds();
  if (!ids.includes(safeRecordId)) {
    return;
  }

  savePendingRecordDeleteIds(ids.filter((id) => id !== safeRecordId));
};

const applyPendingRecordDeleteOverlay = (
  cache: PatientDatabaseCache,
  pendingRecordDeleteIds: string[],
) => {
  const safePendingRecordIds = sanitizeIdList(pendingRecordDeleteIds);
  if (safePendingRecordIds.length === 0) {
    return normalizePatientDatabaseCache(cache);
  }

  let nextCache = normalizePatientDatabaseCache(cache);
  safePendingRecordIds.forEach((recordId) => {
    nextCache = removePatientRecordFromCache(nextCache, recordId);
  });

  return normalizePatientDatabaseCache(nextCache);
};

export const loadPatientDatabaseCache = (): PatientDatabaseCache => {
  const queue = loadPatientSyncQueue();
  const pendingRecordDeleteIds = loadPendingRecordDeleteIds();
  const storedPatients = parseStoredJson(
    PATIENTS_CACHE_KEY,
    null as PatientSummary[] | null,
  );
  const storedRecords = parseStoredJson(
    PATIENT_RECORDS_CACHE_KEY,
    null as PatientRecord[] | null,
  );

  const hasStoredData = Array.isArray(storedPatients) || Array.isArray(storedRecords);
  if (hasStoredData) {
    inMemoryPatientCache = applyPendingRecordDeleteOverlay(
      applySyncQueueOverlayToCache(
        normalizePatientDatabaseCache({
          patients: Array.isArray(storedPatients) ? storedPatients : [],
          records: Array.isArray(storedRecords) ? storedRecords : [],
        }),
        queue,
      ),
      pendingRecordDeleteIds,
    );
    return inMemoryPatientCache;
  }

  inMemoryPatientCache = applyPendingRecordDeleteOverlay(
    applySyncQueueOverlayToCache(
      normalizePatientDatabaseCache(inMemoryPatientCache),
      queue,
    ),
    pendingRecordDeleteIds,
  );
  return inMemoryPatientCache;
};

const applySyncQueueOverlayToCache = (
  cache: PatientDatabaseCache,
  queue: SyncQueueItem[],
): PatientDatabaseCache => {
  const normalizedCache = normalizePatientDatabaseCache(cache);
  if (!Array.isArray(queue) || queue.length === 0) {
    return normalizedCache;
  }

  let nextCache = normalizedCache;

  queue.forEach((item) => {
    if (item.type === "upsertPatientRecord") {
      nextCache = upsertPatientRecordInCache(nextCache, item.record);
      return;
    }

    if (item.type === "setPatientDeletedState") {
      nextCache = applyPatientDeletedState(nextCache, item.patientId, item.deletedAt);
      return;
    }

    if (item.type === "permanentlyDeletePatients") {
      nextCache = removePatientsFromCache(nextCache, item.patientIds);
      return;
    }

    if (item.type === "setPatientAttachments") {
      const existingPatient = nextCache.patients.find((patient) => patient.id === item.patientId) || null;
      if (!existingPatient) {
        return;
      }

      const attachmentMap = new Map<string, PatientAttachment>();
      (item.attachments || []).forEach((attachment) => {
        attachmentMap.set(attachment.id, attachment);
      });
      (existingPatient.attachments || [])
        .filter((attachment) => isLocalPatientAttachment(attachment))
        .forEach((attachment) => {
          attachmentMap.set(attachment.id, attachment);
        });

      nextCache = normalizePatientDatabaseCache({
        patients: nextCache.patients.map((patient) =>
          patient.id === item.patientId
            ? {
                ...patient,
                attachments: Array.from(attachmentMap.values()).sort((left, right) =>
                  (right.uploadedAt || "").localeCompare(left.uploadedAt || ""),
                ),
                updatedAt: new Date().toISOString(),
              }
            : patient,
        ),
        records: nextCache.records,
      });
      return;
    }

    if (item.type === "deletePatientRecord") {
      nextCache = removePatientRecordFromCache(nextCache, item.recordId);
    }
  });

  return normalizePatientDatabaseCache(nextCache);
};

export const savePatientDatabaseCache = (cache: PatientDatabaseCache) => {
  const normalizedCache = normalizePatientDatabaseCache(cache);
  inMemoryPatientCache = normalizedCache;
  const wasRecordsKeyBlockedBeforeWrite = localStorageWriteBlockedKeys.has(PATIENT_RECORDS_CACHE_KEY);
  const wrotePatients = writeStoredJson(PATIENTS_CACHE_KEY, normalizedCache.patients);
  let wroteRecords = writeStoredJson(PATIENT_RECORDS_CACHE_KEY, normalizedCache.records);

  if (!wroteRecords && !wasRecordsKeyBlockedBeforeWrite) {
    const compactRecords = normalizedCache.records.map((record) => ({
      ...record,
      reportSnapshot: null,
    }));
    localStorageWriteBlockedKeys.delete(PATIENT_RECORDS_CACHE_KEY);
    wroteRecords = writeStoredJson(PATIENT_RECORDS_CACHE_KEY, compactRecords);
  }

  if (!wrotePatients || !wroteRecords) {
    if (!hasShownPatientCacheQuotaWarning) {
      hasShownPatientCacheQuotaWarning = true;
      runtimeState.hasShownPatientCacheQuotaWarning = true;
      console.warn("Patient cache persisted in memory only due localStorage write limits.");
    }
  } else {
    hasShownPatientCacheQuotaWarning = false;
    runtimeState.hasShownPatientCacheQuotaWarning = false;
  }
};

export const loadPatientSyncQueue = () => {
  const storedQueue = parseStoredJson(
    PATIENT_SYNC_QUEUE_KEY,
    null as SyncQueueItem[] | null,
  );

  if (Array.isArray(storedQueue)) {
    inMemoryPatientSyncQueue = storedQueue;
    return storedQueue;
  }

  return inMemoryPatientSyncQueue;
};

const savePatientSyncQueue = (queue: SyncQueueItem[]) => {
  inMemoryPatientSyncQueue = queue;
  const wroteQueue = writeStoredJson(PATIENT_SYNC_QUEUE_KEY, queue);
  if (!wroteQueue) {
    if (!hasShownPatientSyncQueueQuotaWarning) {
      hasShownPatientSyncQueueQuotaWarning = true;
      runtimeState.hasShownPatientSyncQueueQuotaWarning = true;
      console.warn("Patient sync queue persisted in memory only due localStorage write limits.");
    }
  } else {
    hasShownPatientSyncQueueQuotaWarning = false;
    runtimeState.hasShownPatientSyncQueueQuotaWarning = false;
  }
};

export const enqueuePatientSyncItem = (item: Omit<SyncQueueItem, "id" | "createdAt">) => {
  const queue = loadPatientSyncQueue();
  const dedupedQueue = queue.filter((queuedItem) => {
    if (item.type === "upsertPatientRecord" && queuedItem.type === "upsertPatientRecord") {
      return queuedItem.record.id !== item.record.id;
    }

    if (item.type === "setPatientAttachments" && queuedItem.type === "setPatientAttachments") {
      return queuedItem.patientId !== item.patientId;
    }

    if (item.type === "setPatientDeletedState" && queuedItem.type === "setPatientDeletedState") {
      return queuedItem.patientId !== item.patientId;
    }

    if (item.type === "deletePatientRecord" && queuedItem.type === "deletePatientRecord") {
      return queuedItem.recordId !== item.recordId;
    }

    return true;
  });

  const nextQueue = [
    ...dedupedQueue,
    {
      ...item,
      id: createQueueId(),
      createdAt: new Date().toISOString(),
    } as SyncQueueItem,
  ];
  savePatientSyncQueue(nextQueue);
  return nextQueue.length;
};

export const fetchPatientDatabaseSnapshot = async () => {
  if (!firestoreDb) {
    return loadPatientDatabaseCache();
  }

  const localCache = loadPatientDatabaseCache();
  const [patientSnapshot, recordSnapshot] = await Promise.all([
    getDocs(collection(firestoreDb, "patients")),
    getDocs(collection(firestoreDb, "patient_records")),
  ]);

  const normalizedCache = normalizePatientDatabaseCache({
    patients: patientSnapshot.docs.map((entry) => {
      const remotePatient = {
        id: entry.id,
        ...entry.data(),
      } as PatientSummary;
      const localPatient = localCache.patients.find((patient) => patient.id === remotePatient.id);
      const localOnlyAttachments = (localPatient?.attachments || []).filter((attachment) =>
        isLocalPatientAttachment(attachment),
      );

      if (localOnlyAttachments.length === 0) {
        return remotePatient;
      }

      const attachmentMap = new Map<string, PatientAttachment>();
      [...(remotePatient.attachments || []), ...localOnlyAttachments].forEach((attachment) => {
        attachmentMap.set(attachment.id, attachment);
      });

      return {
        ...remotePatient,
        attachments: Array.from(attachmentMap.values()).sort((left, right) =>
          right.uploadedAt.localeCompare(left.uploadedAt),
        ),
      };
    }) as PatientSummary[],
    records: recordSnapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    })) as PatientRecord[],
  });

  const remoteRecordIds = new Set(
    normalizedCache.records
      .map((record) => sanitizeId(record.id))
      .filter((recordId) => isValidFirestoreDocId(recordId)),
  );
  const persistedPendingRecordDeleteIds = loadPendingRecordDeleteIds();
  const unresolvedPendingRecordDeleteIds = persistedPendingRecordDeleteIds.filter((recordId) =>
    remoteRecordIds.has(recordId),
  );
  if (unresolvedPendingRecordDeleteIds.length !== persistedPendingRecordDeleteIds.length) {
    savePendingRecordDeleteIds(unresolvedPendingRecordDeleteIds);
  }

  const cacheWithPendingChanges = applyPendingRecordDeleteOverlay(
    applySyncQueueOverlayToCache(normalizedCache, loadPatientSyncQueue()),
    unresolvedPendingRecordDeleteIds,
  );
  savePatientDatabaseCache(cacheWithPendingChanges);
  return cacheWithPendingChanges;
};

const syncUpsertPatientRecord = async (patient: PatientSummary, record: PatientRecord) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  const safePatientId = sanitizeId(patient?.id);
  const safeRecordId = sanitizeId(record?.id);
  if (!isValidFirestoreDocId(safePatientId) || !isValidFirestoreDocId(safeRecordId)) {
    return;
  }

  const normalizedPatient = {
    ...patient,
    id: safePatientId,
  };
  const normalizedRecord = {
    ...record,
    id: safeRecordId,
    patientDocId: sanitizeId(record?.patientDocId) || safePatientId,
  };

  await Promise.all([
    setDoc(doc(firestoreDb, "patients", safePatientId), toSerializable(normalizedPatient), {
      merge: true,
    }),
    setDoc(doc(firestoreDb, "patient_records", safeRecordId), toSerializable(normalizedRecord), {
      merge: true,
    }),
  ]);
};

const syncPatientDeletedState = async (
  patientId: string,
  deletedAt: string | null,
  recordIds: string[],
) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  const safePatientId = String(patientId || "").trim();
  const safeRecordIds = sanitizeIdList(recordIds);

  if (!isValidFirestoreDocId(safePatientId)) {
    return;
  }

  const batch = writeBatch(firestoreDb);
  batch.set(
    doc(firestoreDb, "patients", safePatientId),
    {
      deletedAt,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  safeRecordIds.forEach((recordId) => {
    batch.set(
      doc(firestoreDb, "patient_records", recordId),
      {
        deletedAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  });

  await batch.commit();
};

const syncPermanentPatientDelete = async (patientIds: string[], recordIds: string[]) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  const safePatientIds = sanitizeIdList(patientIds);
  const safeRecordIds = sanitizeIdList(recordIds);

  if (safePatientIds.length === 0 && safeRecordIds.length === 0) {
    return;
  }

  const batch = writeBatch(firestoreDb);

  safePatientIds.forEach((patientId) => {
    batch.delete(doc(firestoreDb, "patients", patientId));
  });

  safeRecordIds.forEach((recordId) => {
    batch.delete(doc(firestoreDb, "patient_records", recordId));
  });

  await batch.commit();
};

const syncPatientAttachments = async (
  patientId: string,
  attachments: PatientAttachment[],
) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  const safePatientId = sanitizeId(patientId);
  if (!isValidFirestoreDocId(safePatientId)) {
    return;
  }

  await setDoc(
    doc(firestoreDb, "patients", safePatientId),
    {
      attachments: toSerializable(attachments),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

const syncDeletePatientRecord = async (
  patient: PatientSummary | null,
  recordId: string,
) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  const safePatientId = sanitizeId(patient?.id);
  const safeRecordId = sanitizeId(recordId);
  if (!isValidFirestoreDocId(safeRecordId)) {
    return;
  }

  const batch = writeBatch(firestoreDb);
  if (patient && isValidFirestoreDocId(safePatientId)) {
    const normalizedPatient = {
      ...patient,
      id: safePatientId,
    };
    batch.set(doc(firestoreDb, "patients", safePatientId), toSerializable(normalizedPatient), {
      merge: true,
    });
  }
  batch.delete(doc(firestoreDb, "patient_records", safeRecordId));
  await batch.commit();
};

export const processPatientSyncQueue = async () => {
  if (!firestoreDb || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { processed: 0, failed: loadPatientSyncQueue().length };
  }

  if (Date.now() < nextPatientSyncAttemptAt) {
    return { processed: 0, failed: loadPatientSyncQueue().length };
  }

  const queue = loadPatientSyncQueue();
  const remainingQueue: SyncQueueItem[] = [];
  let processed = 0;
  let shouldPauseFurtherSync = false;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    try {
      if (item.type === "upsertPatientRecord") {
        await syncUpsertPatientRecord(item.patient, item.record);
      } else if (item.type === "setPatientDeletedState") {
        await syncPatientDeletedState(item.patientId, item.deletedAt, item.recordIds);
      } else if (item.type === "permanentlyDeletePatients") {
        await syncPermanentPatientDelete(item.patientIds, item.recordIds);
      } else if (item.type === "setPatientAttachments") {
        await syncPatientAttachments(item.patientId, item.attachments);
      } else if (item.type === "deletePatientRecord") {
        await syncDeletePatientRecord(item.patient, item.recordId);
      }
      processed += 1;
    } catch (error) {
      console.error("Failed to process patient sync queue item", item, error);
      remainingQueue.push(item);

      const errorCode =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code || "")
          : "";
      const message = String(
        (typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : "") || "",
      ).toLowerCase();
      const shouldBackoff =
        errorCode.includes("resource-exhausted") ||
        errorCode.includes("unavailable") ||
        message.includes("resource-exhausted") ||
        message.includes("maximum allowed queued writes") ||
        message.includes("network") ||
        message.includes("blocked_by_client");

      if (shouldBackoff) {
        shouldPauseFurtherSync = true;
        for (let restIndex = index + 1; restIndex < queue.length; restIndex += 1) {
          remainingQueue.push(queue[restIndex]);
        }
        break;
      }
    }
  }

  savePatientSyncQueue(remainingQueue);
  nextPatientSyncAttemptAt = shouldPauseFurtherSync ? Date.now() + PATIENT_SYNC_RETRY_MS : 0;
  return { processed, failed: remainingQueue.length };
};

export const queuePatientRecordSync = (patient: PatientSummary, record: PatientRecord) =>
{
  const safePatientId = sanitizeId(patient?.id);
  const safeRecordId = sanitizeId(record?.id);
  if (!isValidFirestoreDocId(safePatientId) || !isValidFirestoreDocId(safeRecordId)) {
    return loadPatientSyncQueue().length;
  }

  removePendingRecordDeleteId(safeRecordId);

  return enqueuePatientSyncItem({
    type: "upsertPatientRecord",
    patient: toSerializable({
      ...patient,
      id: safePatientId,
    }),
    record: toSerializable({
      ...record,
      id: safeRecordId,
      patientDocId: sanitizeId(record?.patientDocId) || safePatientId,
    }),
  });
};

export const queuePatientDeletedStateSync = (
  patientId: string,
  deletedAt: string | null,
  recordIds: string[],
) => {
  const safePatientId = sanitizeId(patientId);
  const safeRecordIds = sanitizeIdList(recordIds);
  if (!isValidFirestoreDocId(safePatientId)) {
    return loadPatientSyncQueue().length;
  }

  return enqueuePatientSyncItem({
    type: "setPatientDeletedState",
    patientId: safePatientId,
    deletedAt,
    recordIds: safeRecordIds,
  });
};

export const queuePermanentPatientDeleteSync = (
  patientIds: string[],
  recordIds: string[],
) => {
  const safePatientIds = sanitizeIdList(patientIds);
  const safeRecordIds = sanitizeIdList(recordIds);
  if (safePatientIds.length === 0 && safeRecordIds.length === 0) {
    return loadPatientSyncQueue().length;
  }

  safeRecordIds.forEach((recordId) => {
    addPendingRecordDeleteId(recordId);
  });

  return enqueuePatientSyncItem({
    type: "permanentlyDeletePatients",
    patientIds: safePatientIds,
    recordIds: safeRecordIds,
  });
};

export const queuePatientAttachmentsSync = (
  patientId: string,
  attachments: PatientAttachment[],
) => {
  const safePatientId = sanitizeId(patientId);
  if (!isValidFirestoreDocId(safePatientId)) {
    return loadPatientSyncQueue().length;
  }

  return enqueuePatientSyncItem({
    type: "setPatientAttachments",
    patientId: safePatientId,
    attachments: toSerializable(stripLocalPatientAttachments(attachments)),
  });
};

export const queuePatientRecordDeleteSync = (
  patient: PatientSummary | null,
  recordId: string,
) => {
  const safePatientId = sanitizeId(patient?.id);
  const safeRecordId = sanitizeId(recordId);
  if (!isValidFirestoreDocId(safeRecordId)) {
    return loadPatientSyncQueue().length;
  }

  addPendingRecordDeleteId(safeRecordId);

  return enqueuePatientSyncItem({
    type: "deletePatientRecord",
    patient:
      patient && isValidFirestoreDocId(safePatientId)
        ? toSerializable({
            ...patient,
            id: safePatientId,
          })
        : null,
    recordId: safeRecordId,
  });
};

export const resetPatientDatabaseCache = () => {
  savePatientDatabaseCache(createEmptyPatientDatabaseCache());
  savePatientSyncQueue([]);
  savePendingRecordDeleteIds([]);
};
