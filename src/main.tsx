import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const HARD_RELOAD_SYNC_EVENT_KEY = "endoscopy_app_hard_reload_sync_v1";
const HARD_RELOAD_SYNC_SESSION_KEY = "endoscopy_app_hard_reload_session_v1";
const HARD_RELOAD_SYNC_MAX_EVENT_AGE_MS = 30000;

const createHardReloadSyncSessionId = () => {
  if (typeof window === "undefined") {
    return "server";
  }

  const existingSessionId = window.sessionStorage.getItem(HARD_RELOAD_SYNC_SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `reload-sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(HARD_RELOAD_SYNC_SESSION_KEY, nextSessionId);
  return nextSessionId;
};

const setupHardReloadSync = () => {
  if (typeof window === "undefined") {
    return;
  }

  const sessionId = createHardReloadSyncSessionId();
  let isRemoteReloadInProgress = false;

  const broadcastHardReload = () => {
    try {
      const payload = JSON.stringify({
        sourceSessionId: sessionId,
        requestedAt: new Date().toISOString(),
      });
      window.localStorage.setItem(HARD_RELOAD_SYNC_EVENT_KEY, payload);
    } catch (error) {
      console.warn("Failed to broadcast hard refresh event", error);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = String(event.key || "").toLowerCase();
    const hasControlModifier = event.ctrlKey || event.metaKey;
    const isCtrlShiftR = hasControlModifier && event.shiftKey && key === "r";
    const isCtrlF5 = event.ctrlKey && key === "f5";
    const isCtrlShiftF5 = event.ctrlKey && event.shiftKey && key === "f5";

    if (isCtrlShiftR || isCtrlF5 || isCtrlShiftF5) {
      broadcastHardReload();
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key !== HARD_RELOAD_SYNC_EVENT_KEY ||
      !event.newValue ||
      isRemoteReloadInProgress
    ) {
      return;
    }

    try {
      const parsedPayload = JSON.parse(event.newValue) as {
        sourceSessionId?: string;
        requestedAt?: string;
      };

      if (!parsedPayload.sourceSessionId || parsedPayload.sourceSessionId === sessionId) {
        return;
      }

      const requestedAt = Date.parse(parsedPayload.requestedAt || "");
      if (Number.isNaN(requestedAt)) {
        return;
      }

      if (Date.now() - requestedAt > HARD_RELOAD_SYNC_MAX_EVENT_AGE_MS) {
        return;
      }

      isRemoteReloadInProgress = true;
      window.location.reload();
    } catch (error) {
      console.warn("Failed to process hard refresh sync event", error);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("storage", handleStorage);
};

const unregisterDevServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    const appCacheKeys = cacheKeys.filter((cacheKey) => cacheKey.startsWith("endoscope-sa-"));
    await Promise.all(appCacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }
}

if (import.meta.env.DEV) {
  window.addEventListener("load", () => {
    void unregisterDevServiceWorkers();
  });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registered successfully:", registration.scope);
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed:", error);
      });
  });
}

setupHardReloadSync();

createRoot(document.getElementById("root")!).render(<App />);
