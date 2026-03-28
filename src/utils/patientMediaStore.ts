import {
  FirebaseStorage,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { firebaseApp, firebaseStorage } from "@/lib/firebase";
import {
  deleteLocalPatientAttachment,
  isLocalPatientAttachment,
  saveLocalPatientFiles,
} from "@/utils/localPatientAttachmentStore";
import { PatientAttachment } from "@/utils/patientRecords";

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

export const uploadPatientFiles = async (
  patientId: string,
  files: File[],
): Promise<PatientAttachment[]> => {
  const validFiles = Array.from(files || []).filter(Boolean);
  const useLocalOnlyUploads = shouldUseLocalOnlyUploads();

  return Promise.all(
    validFiles.map(async (file) => {
      const id = createId();
      const safeFileName = sanitizeFileName(file.name);
      const storagePath = `patients/${patientId}/${id}-${safeFileName}`;
      const uploadedAt = new Date().toISOString();
      const storageCandidates = useLocalOnlyUploads ? [] : getStorageCandidates();
      let lastError: unknown = null;

      for (const candidate of storageCandidates) {
        try {
          const storageRef = ref(candidate.instance, storagePath);

          await uploadBytes(storageRef, file, {
            contentType: file.type || undefined,
          });

          return {
            id,
            name: file.name || safeFileName,
            url: await getDownloadURL(storageRef),
            storagePath,
            mimeType: file.type || "application/octet-stream",
            kind: getAttachmentKind(file.type, file.name),
            sizeBytes: Number(file.size || 0),
            uploadedAt,
            source: "firebase",
          } satisfies PatientAttachment;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        console.error("Falling back to local patient attachment storage", lastError);
      }
      const [localAttachment] = await saveLocalPatientFiles(patientId, [file]);
      return {
        ...localAttachment,
        id,
        name: file.name || safeFileName,
        kind: getAttachmentKind(file.type, file.name),
        sizeBytes: Number(file.size || 0),
        uploadedAt,
      } satisfies PatientAttachment;
    }),
  );
};

export const deletePatientFile = async (attachment: PatientAttachment) => {
  if (isLocalPatientAttachment(attachment)) {
    await deleteLocalPatientAttachment(attachment.storagePath);
    return;
  }

  const storagePath = String(attachment.storagePath || "").trim();
  if (!storagePath) {
    return;
  }

  const storageCandidates = getStorageCandidates();
  let lastError: unknown = null;

  for (const candidate of storageCandidates) {
    try {
      const storageRef = ref(candidate.instance, storagePath);
      await deleteObject(storageRef);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }
};

const shouldUseLocalOnlyUploads = () => {
  const forcedLocalUploads =
    String(import.meta.env.VITE_FORCE_LOCAL_MEDIA_UPLOADS || "").trim().toLowerCase() === "true";

  if (forcedLocalUploads) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return hostname === "127.0.0.1" || hostname === "localhost";
};

const getStorageCandidates = (): Array<{ bucket: string; instance: FirebaseStorage }> => {
  if (!firebaseApp && !firebaseStorage) {
    return [];
  }

  const configuredBucket = String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim();
  const projectId = String(import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim();
  const bucketCandidates = [configuredBucket];

  if (configuredBucket.endsWith(".firebasestorage.app")) {
    bucketCandidates.push(
      configuredBucket.replace(/\.firebasestorage\.app$/, ".appspot.com"),
    );
  } else if (configuredBucket.endsWith(".appspot.com")) {
    bucketCandidates.push(
      configuredBucket.replace(/\.appspot\.com$/, ".firebasestorage.app"),
    );
  }

  if (projectId) {
    bucketCandidates.push(`${projectId}.appspot.com`);
    bucketCandidates.push(`${projectId}.firebasestorage.app`);
  }

  const uniqueBuckets = Array.from(
    new Set(bucketCandidates.map((bucket) => bucket.trim()).filter(Boolean)),
  );

  return uniqueBuckets
    .map((bucket) => {
      if (!firebaseApp) {
        return firebaseStorage ? { bucket, instance: firebaseStorage } : null;
      }

      return {
        bucket,
        instance: getStorage(firebaseApp, `gs://${bucket}`),
      };
    })
    .filter(Boolean) as Array<{ bucket: string; instance: FirebaseStorage }>;
};
