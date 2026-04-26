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
let inMemoryQueuedLiveTemplateDraft: LiveTemplateDraftSnapshot | null = null;
let hasShownLiveDraftQuotaWarning = false;
let hasShownLiveDraftParseWarning = false;
let liveDraftQueueLocalStorageUnavailable = false;
let cachedLiveTemplateDraftSessionId = "";
let nextLiveTemplateDraftSyncAttemptAt = 0;
const LIVE_TEMPLATE_DRAFT_SYNC_RETRY_MS = 15000;

export interface LiveTemplateDraftSnapshot {
  schemaVersion: number;
  payload: Record<string, any>;
  payloadSignature: string;
  updatedAtIso: string;
  updatedAt?: unknown;
  updatedBySessionId: string;
}

export const createLiveTemplateDraftSignature = (payload: Record<string, any>) => {
  const serializedPayload = JSON.stringify(payload || {});
  let hash = 2166136261;

  for (let index = 0; index < serializedPayload.length; index += 1) {
    hash ^= serializedPayload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${serializedPayload.length}:${(hash >>> 0).toString(16)}`;
};

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
    if (!hasShownLiveDraftParseWarning) {
      hasShownLiveDraftParseWarning = true;
      console.error("Failed to parse live template draft cache", error);
    }
    return null;
  }
};

const saveStoredDraft = (snapshot: LiveTemplateDraftSnapshot | null) => {
  if (typeof window === "undefined") {
    return;
  }

  inMemoryQueuedLiveTemplateDraft = snapshot;

  if (!snapshot) {
    if (!liveDraftQueueLocalStorageUnavailable) {
      try {
        localStorage.removeItem(LIVE_TEMPLATE_DRAFT_QUEUE_KEY);
      } catch (error) {
        console.warn("Failed to clear queued live template draft from localStorage", error);
      }
    }
    return;
  }

  if (liveDraftQueueLocalStorageUnavailable) {
    return;
  }

  try {
    localStorage.setItem(LIVE_TEMPLATE_DRAFT_QUEUE_KEY, JSON.stringify(snapshot));
    liveDraftQueueLocalStorageUnavailable = false;
    hasShownLiveDraftQuotaWarning = false;
  } catch (error) {
    liveDraftQueueLocalStorageUnavailable = true;
    if (!hasShownLiveDraftQuotaWarning) {
      hasShownLiveDraftQuotaWarning = true;
      console.warn(
        "Live template draft queue exceeded localStorage capacity; using in-memory fallback.",
        error,
      );
    }
  }
};

export const getLiveTemplateDraftSessionId = () => {
  if (typeof window === "undefined") {
    return "server-session";
  }

  if (cachedLiveTemplateDraftSessionId) {
    return cachedLiveTemplateDraftSessionId;
  }

  try {
    const existing = localStorage.getItem(LIVE_TEMPLATE_DRAFT_SESSION_KEY);
    if (existing) {
      cachedLiveTemplateDraftSessionId = existing;
      return existing;
    }
  } catch {
    // Fall back to in-memory session id when localStorage cannot be read.
  }

  const nextSessionId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `live-draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  cachedLiveTemplateDraftSessionId = nextSessionId;
  try {
    localStorage.setItem(LIVE_TEMPLATE_DRAFT_SESSION_KEY, nextSessionId);
  } catch {
    // Keep in-memory session id when localStorage quota is exceeded.
  }
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
    return inMemoryQueuedLiveTemplateDraft;
  }

  if (liveDraftQueueLocalStorageUnavailable) {
    return inMemoryQueuedLiveTemplateDraft;
  }

  try {
    const storedDraft = parseStoredDraft(
      localStorage.getItem(LIVE_TEMPLATE_DRAFT_QUEUE_KEY),
    );

    if (storedDraft) {
      inMemoryQueuedLiveTemplateDraft = storedDraft;
      return storedDraft;
    }
  } catch (error) {
    console.warn("Failed to load queued live template draft from localStorage", error);
  }

  return inMemoryQueuedLiveTemplateDraft;
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

  if (Date.now() < nextLiveTemplateDraftSyncAttemptAt) {
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

  try {
    await setDoc(
      draftRef,
      {
        ...snapshot,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    nextLiveTemplateDraftSyncAttemptAt = 0;
    clearQueuedLiveTemplateDraftSync();
    return { processed: true, pending: false };
  } catch (error) {
    nextLiveTemplateDraftSyncAttemptAt = Date.now() + LIVE_TEMPLATE_DRAFT_SYNC_RETRY_MS;
    console.error("Failed to sync queued live template draft", error);
    return { processed: false, pending: true };
  }
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
