import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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

createRoot(document.getElementById("root")!).render(<App />);
