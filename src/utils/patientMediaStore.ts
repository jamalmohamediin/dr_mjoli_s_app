import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase";
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
  if (!firebaseStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const validFiles = Array.from(files || []).filter(Boolean);

  return Promise.all(
    validFiles.map(async (file) => {
      const id = createId();
      const safeFileName = sanitizeFileName(file.name);
      const storagePath = `patients/${patientId}/${id}-${safeFileName}`;
      const storageRef = ref(firebaseStorage, storagePath);

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
        uploadedAt: new Date().toISOString(),
      } satisfies PatientAttachment;
    }),
  );
};
