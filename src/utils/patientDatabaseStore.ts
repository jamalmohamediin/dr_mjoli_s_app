import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { isLocalPatientAttachment, stripLocalPatientAttachments } from "@/utils/localPatientAttachmentStore";
import {
  createEmptyPatientDatabaseCache,
  PatientAttachment,
  PatientDatabaseCache,
  PatientRecord,
  PatientSummary,
} from "@/utils/patientRecords";

const PATIENTS_CACHE_KEY = "patients_cache_v1";
const PATIENT_RECORDS_CACHE_KEY = "patient_records_cache_v1";
const PATIENT_SYNC_QUEUE_KEY = "patient_sync_queue_v1";

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
      patient: PatientSummary;
      recordId: string;
    };

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
    console.error(`Failed to parse local cache for ${key}`, error);
    return fallback;
  }
};

const writeStoredJson = (key: string, value: any) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
};

const toSerializable = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const createQueueId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const loadPatientDatabaseCache = (): PatientDatabaseCache => ({
  patients: parseStoredJson(PATIENTS_CACHE_KEY, [] as PatientSummary[]),
  records: parseStoredJson(PATIENT_RECORDS_CACHE_KEY, [] as PatientRecord[]),
});

export const savePatientDatabaseCache = (cache: PatientDatabaseCache) => {
  writeStoredJson(PATIENTS_CACHE_KEY, cache.patients);
  writeStoredJson(PATIENT_RECORDS_CACHE_KEY, cache.records);
};

export const loadPatientSyncQueue = () =>
  parseStoredJson(PATIENT_SYNC_QUEUE_KEY, [] as SyncQueueItem[]);

const savePatientSyncQueue = (queue: SyncQueueItem[]) => {
  writeStoredJson(PATIENT_SYNC_QUEUE_KEY, queue);
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

  const cache = {
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
  };

  savePatientDatabaseCache(cache);
  return cache;
};

const syncUpsertPatientRecord = async (patient: PatientSummary, record: PatientRecord) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  await Promise.all([
    setDoc(doc(firestoreDb, "patients", patient.id), toSerializable(patient), {
      merge: true,
    }),
    setDoc(doc(firestoreDb, "patient_records", record.id), toSerializable(record), {
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

  const batch = writeBatch(firestoreDb);
  batch.set(
    doc(firestoreDb, "patients", patientId),
    {
      deletedAt,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  recordIds.forEach((recordId) => {
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

  const batch = writeBatch(firestoreDb);

  patientIds.forEach((patientId) => {
    batch.delete(doc(firestoreDb, "patients", patientId));
  });

  recordIds.forEach((recordId) => {
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

  await setDoc(
    doc(firestoreDb, "patients", patientId),
    {
      attachments: toSerializable(attachments),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

const syncDeletePatientRecord = async (
  patient: PatientSummary,
  recordId: string,
) => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured");
  }

  const batch = writeBatch(firestoreDb);
  batch.set(doc(firestoreDb, "patients", patient.id), toSerializable(patient), {
    merge: true,
  });
  batch.delete(doc(firestoreDb, "patient_records", recordId));
  await batch.commit();
};

export const processPatientSyncQueue = async () => {
  if (!firestoreDb || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { processed: 0, failed: loadPatientSyncQueue().length };
  }

  const queue = loadPatientSyncQueue();
  const remainingQueue: SyncQueueItem[] = [];
  let processed = 0;

  for (const item of queue) {
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
    }
  }

  savePatientSyncQueue(remainingQueue);
  return { processed, failed: remainingQueue.length };
};

export const queuePatientRecordSync = (patient: PatientSummary, record: PatientRecord) =>
  enqueuePatientSyncItem({
    type: "upsertPatientRecord",
    patient: toSerializable(patient),
    record: toSerializable(record),
  });

export const queuePatientDeletedStateSync = (
  patientId: string,
  deletedAt: string | null,
  recordIds: string[],
) =>
  enqueuePatientSyncItem({
    type: "setPatientDeletedState",
    patientId,
    deletedAt,
    recordIds,
  });

export const queuePermanentPatientDeleteSync = (
  patientIds: string[],
  recordIds: string[],
) =>
  enqueuePatientSyncItem({
    type: "permanentlyDeletePatients",
    patientIds,
    recordIds,
  });

export const queuePatientAttachmentsSync = (
  patientId: string,
  attachments: PatientAttachment[],
) =>
  enqueuePatientSyncItem({
    type: "setPatientAttachments",
    patientId,
    attachments: toSerializable(stripLocalPatientAttachments(attachments)),
  });

export const queuePatientRecordDeleteSync = (
  patient: PatientSummary,
  recordId: string,
) =>
  enqueuePatientSyncItem({
    type: "deletePatientRecord",
    patient: toSerializable(patient),
    recordId,
  });

export const resetPatientDatabaseCache = () => {
  savePatientDatabaseCache(createEmptyPatientDatabaseCache());
  savePatientSyncQueue([]);
};
