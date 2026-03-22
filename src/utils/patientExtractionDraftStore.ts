import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import {
  createInitialPatientInfoState,
  createPatientStickerSyncSnapshot,
} from "@/utils/patientSticker";

const EXTRACTED_PATIENT_DRAFT_COLLECTION = "development_state";
const EXTRACTED_PATIENT_DRAFT_DOCUMENT = "latest_extracted_patient";
const PATIENT_STICKER_DRAFTS_COLLECTION = "patient_sticker_drafts";

const getDraftDocumentRef = () =>
  firestoreDb
    ? doc(
        firestoreDb,
        EXTRACTED_PATIENT_DRAFT_COLLECTION,
        EXTRACTED_PATIENT_DRAFT_DOCUMENT,
      )
    : null;

const normalizeStoredDraft = (value: any) =>
  createInitialPatientInfoState(createPatientStickerSyncSnapshot(value));

const slugifyDraftPart = (value: any) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const buildPatientStickerDraftId = (patientInfo: any) => {
  const normalized = normalizeStoredDraft(patientInfo);
  const parts = [
    slugifyDraftPart(normalized.patientId),
    slugifyDraftPart(normalized.dateOfBirth),
    slugifyDraftPart(normalized.name),
    slugifyDraftPart(normalized.medicalAidNumber),
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join("__");
  }

  return `draft-${Date.now()}`;
};

const getPatientStickerDraftRef = (patientInfo: any) =>
  firestoreDb
    ? doc(
        firestoreDb,
        PATIENT_STICKER_DRAFTS_COLLECTION,
        buildPatientStickerDraftId(patientInfo),
      )
    : null;

export const saveLatestExtractedPatientDraft = async (patientInfo: any) => {
  const draftRef = getDraftDocumentRef();
  const patientDraftRef = getPatientStickerDraftRef(patientInfo);
  const normalizedDraft = normalizeStoredDraft(patientInfo);

  if (!draftRef) {
    return false;
  }

  const draftId = patientDraftRef?.id || buildPatientStickerDraftId(patientInfo);
  const payload = {
    draftId,
    patientInfo: normalizedDraft,
    schemaVersion: 1,
    updatedAt: serverTimestamp(),
    updatedAtIso: new Date().toISOString(),
  };

  if (patientDraftRef) {
    try {
      await setDoc(patientDraftRef, payload, { merge: true });
    } catch (error: any) {
      // Keep the legacy latest-draft sync working even if the new collection
      // is not available yet in Firestore rules.
      if (String(error?.code || "").includes("permission-denied")) {
        return setDoc(draftRef, payload, { merge: true }).then(() => true);
      }
      console.warn("Failed to save patient sticker draft record", error);
    }
  }

  await setDoc(
    draftRef,
    payload,
    { merge: true },
  );

  return true;
};

export const clearLatestExtractedPatientDraft = async () => {
  const draftRef = getDraftDocumentRef();
  if (!draftRef) {
    return false;
  }

  await deleteDoc(draftRef);
  return true;
};

export const loadLatestExtractedPatientDraft = async () => {
  const draftRef = getDraftDocumentRef();
  if (!draftRef) {
    return null;
  }

  const snapshot = await getDoc(draftRef);
  if (!snapshot.exists()) {
    return null;
  }

  return normalizeStoredDraft(snapshot.data()?.patientInfo);
};

export const subscribeToLatestExtractedPatientDraft = (
  onValue: (patientInfo: any | null) => void,
) => {
  const draftRef = getDraftDocumentRef();
  if (!draftRef) {
    onValue(null);
    return () => undefined;
  }

  return onSnapshot(
    draftRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onValue(null);
        return;
      }

      onValue(normalizeStoredDraft(snapshot.data()?.patientInfo));
    },
    (error) => {
      console.error("Failed to subscribe to extracted patient draft", error);
    },
  );
};
