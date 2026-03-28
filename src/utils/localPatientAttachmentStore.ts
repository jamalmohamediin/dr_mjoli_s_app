import { PatientAttachment } from "@/utils/patientRecords";

const DB_NAME = "dr_mjoli_patient_media";
const DB_VERSION = 1;
const STORE_NAME = "attachments";

interface StoredLocalPatientAttachment {
  key: string;
  patientId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  blob: Blob;
}

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const sanitizeFileName = (value: string) =>
  String(value || "file")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "file";

const getAttachmentKind = (mimeType: string, fileName: string): PatientAttachment["kind"] => {
  const normalizedMimeType = String(mimeType || "").toLowerCase();
  const normalizedName = String(fileName || "").toLowerCase();

  if (normalizedMimeType.startsWith("image/")) {
    return "image";
  }

  if (normalizedMimeType.startsWith("video/")) {
    return "video";
  }

  if (/\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(normalizedName)) {
    return "image";
  }

  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(normalizedName)) {
    return "video";
  }

  return "document";
};

const openDatabase = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error("Failed to open local media database."));
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

const runRequest = <T,>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error || new Error("IndexedDB request failed."));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });

export const isLocalPatientAttachment = (attachment: Pick<PatientAttachment, "storagePath" | "source">) =>
  attachment.source === "local" || String(attachment.storagePath || "").startsWith("local://");

export const saveLocalPatientFiles = async (
  patientId: string,
  files: File[],
): Promise<PatientAttachment[]> => {
  const validFiles = Array.from(files || []).filter(Boolean);
  if (validFiles.length === 0) {
    return [];
  }

  const database = await openDatabase();

  try {
    const attachments: PatientAttachment[] = [];

    for (const file of validFiles) {
      const id = createId();
      const safeFileName = sanitizeFileName(file.name);
      const storagePath = `local://patients/${patientId}/${id}-${safeFileName}`;
      const uploadedAt = new Date().toISOString();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await runRequest(
        store.put({
          key: storagePath,
          patientId,
          name: file.name || safeFileName,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: Number(file.size || 0),
          uploadedAt,
          blob: file,
        } satisfies StoredLocalPatientAttachment),
      );

      attachments.push({
        id,
        name: file.name || safeFileName,
        url: "",
        storagePath,
        mimeType: file.type || "application/octet-stream",
        kind: getAttachmentKind(file.type, file.name),
        sizeBytes: Number(file.size || 0),
        uploadedAt,
        source: "local",
      });
    }

    return attachments;
  } finally {
    database.close();
  }
};

export const resolveLocalPatientAttachmentUrl = async (attachment: PatientAttachment) => {
  if (!isLocalPatientAttachment(attachment)) {
    return attachment.url || null;
  }

  const database = await openDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const record = await runRequest(
      store.get(String(attachment.storagePath)),
    ) as StoredLocalPatientAttachment | undefined;

    if (!record?.blob) {
      return null;
    }

    return URL.createObjectURL(record.blob);
  } finally {
    database.close();
  }
};

export const deleteLocalPatientAttachment = async (storagePath: string) => {
  if (!storagePath) {
    return;
  }

  const database = await openDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await runRequest(store.delete(String(storagePath)));
  } finally {
    database.close();
  }
};

export const stripLocalPatientAttachments = (attachments: PatientAttachment[]) =>
  (attachments || []).filter((attachment) => !isLocalPatientAttachment(attachment));
