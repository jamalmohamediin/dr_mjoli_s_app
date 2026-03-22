import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";

const LIVE_TEMPLATE_DRAFT_COLLECTION = "development_state";
const LIVE_TEMPLATE_DRAFT_DOCUMENT = "live_template_draft";
const LIVE_TEMPLATE_DRAFT_QUEUE_KEY = "live_template_draft_queue_v1";
const LIVE_TEMPLATE_DRAFT_SESSION_KEY = "live_template_draft_session_v1";

export interface LiveTemplateDraftSnapshot {
  schemaVersion: number;
  payload: Record<string, any>;
  payloadSignature: string;
  updatedAtIso: string;
  updatedAt?: unknown;
  updatedBySessionId: string;
}

const getLiveTemplateDraftRef = () =>
  firestoreDb
    ? doc(
        firestoreDb,
        LIVE_TEMPLATE_DRAFT_COLLECTION,
        LIVE_TEMPLATE_DRAFT_DOCUMENT,
      )
    : null;

const parseStoredDraft = (rawValue: string | null) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as LiveTemplateDraftSnapshot;
  } catch (error) {
    console.error("Failed to parse live template draft cache", error);
    return null;
  }
};

const saveStoredDraft = (snapshot: LiveTemplateDraftSnapshot | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!snapshot) {
    localStorage.removeItem(LIVE_TEMPLATE_DRAFT_QUEUE_KEY);
    return;
  }

  localStorage.setItem(LIVE_TEMPLATE_DRAFT_QUEUE_KEY, JSON.stringify(snapshot));
};

export const getLiveTemplateDraftSessionId = () => {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = localStorage.getItem(LIVE_TEMPLATE_DRAFT_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const nextSessionId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `live-draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(LIVE_TEMPLATE_DRAFT_SESSION_KEY, nextSessionId);
  return nextSessionId;
};

export const createLiveTemplateDraftSnapshot = (
  payload: Record<string, any>,
  payloadSignature: string,
): LiveTemplateDraftSnapshot => ({
  schemaVersion: 1,
  payload: JSON.parse(JSON.stringify(payload || {})),
  payloadSignature,
  updatedAtIso: new Date().toISOString(),
  updatedBySessionId: getLiveTemplateDraftSessionId(),
});

export const loadQueuedLiveTemplateDraftSync = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return parseStoredDraft(localStorage.getItem(LIVE_TEMPLATE_DRAFT_QUEUE_KEY));
};

export const queueLiveTemplateDraftSync = (snapshot: LiveTemplateDraftSnapshot) => {
  saveStoredDraft(snapshot);
  return snapshot;
};

export const clearQueuedLiveTemplateDraftSync = () => {
  saveStoredDraft(null);
};

export const processQueuedLiveTemplateDraftSync = async () => {
  if (!firestoreDb || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { processed: false, pending: Boolean(loadQueuedLiveTemplateDraftSync()) };
  }

  const snapshot = loadQueuedLiveTemplateDraftSync();
  if (!snapshot) {
    return { processed: false, pending: false };
  }

  const draftRef = getLiveTemplateDraftRef();
  if (!draftRef) {
    return { processed: false, pending: true };
  }

  await setDoc(
    draftRef,
    {
      ...snapshot,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  clearQueuedLiveTemplateDraftSync();
  return { processed: true, pending: false };
};

export const loadLiveTemplateDraft = async () => {
  const draftRef = getLiveTemplateDraftRef();
  if (!draftRef) {
    return null;
  }

  const snapshot = await getDoc(draftRef);
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as LiveTemplateDraftSnapshot;
};

export const subscribeToLiveTemplateDraft = (
  onValue: (draft: LiveTemplateDraftSnapshot | null) => void,
) => {
  const draftRef = getLiveTemplateDraftRef();
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

      onValue(snapshot.data() as LiveTemplateDraftSnapshot);
    },
    (error) => {
      console.error("Failed to subscribe to live template draft", error);
    },
  );
};
