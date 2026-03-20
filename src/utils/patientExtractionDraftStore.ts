import {
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

export const saveLatestExtractedPatientDraft = async (patientInfo: any) => {
  const draftRef = getDraftDocumentRef();
  if (!draftRef) {
    return false;
  }

  await setDoc(
    draftRef,
    {
      patientInfo: normalizeStoredDraft(patientInfo),
      schemaVersion: 1,
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true },
  );

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
