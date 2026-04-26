// Data persistence utility for saving and loading form data
import { toast } from 'sonner';

const STORAGE_PREFIX = 'endoscopy_app_';
const LARGE_DATA_URL_THRESHOLD = 2048;
const LARGE_TEXT_THRESHOLD = 120000;
const quotaWarningTracker = new Set<string>();
const quotaErrorLogTracker = new Set<string>();
const inMemoryStorageFallback = new Map<string, any>();

export interface StorageConfig {
  key: string;
  data: any;
  timestamp?: string;
  reducedForQuota?: boolean;
}

const isQuotaExceededError = (error: unknown) => {
  if (!error) {
    return false;
  }

  const anyError = error as {
    name?: string;
    code?: number;
    message?: string;
  };
  const message = String(anyError.message || "").toLowerCase();

  return (
    anyError.name === "QuotaExceededError" ||
    anyError.code === 22 ||
    anyError.code === 1014 ||
    message.includes("quotaexceedederror") ||
    message.includes("exceeded the quota")
  );
};

const stripLargeStoragePayload = (value: any): any => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("data:") && trimmed.length > LARGE_DATA_URL_THRESHOLD) {
      return "";
    }

    if (value.length > LARGE_TEXT_THRESHOLD) {
      return value.slice(0, LARGE_TEXT_THRESHOLD);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => stripLargeStoragePayload(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        stripLargeStoragePayload(nestedValue),
      ]),
    );
  }

  return value;
};

const compactKnownReportPayload = (key: string, value: any) => {
  if (!value || typeof value !== "object" || key !== "endoscopy_report") {
    return value;
  }

  let clonedValue: any = value;
  try {
    clonedValue = JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }

  const compactTemplateDiagramDuplicates = (
    templateKey: "gastroscopy" | "colonoscopy",
    legacyCanvasKey: "gastroscopyCanvasData" | "colonoscopyCanvasData",
    legacyFindingsKey: "gastroscopyFindings" | "colonoscopyFindings",
  ) => {
    const templateCanvasImage = String(
      clonedValue?.[templateKey]?.diagram?.canvasImageData || "",
    ).trim();

    if (!templateCanvasImage) {
      return;
    }

    if (
      String(clonedValue?.[legacyCanvasKey] || "").trim() === templateCanvasImage
    ) {
      clonedValue[legacyCanvasKey] = "";
    }

    const legacyFindings = clonedValue?.[legacyFindingsKey];
    if (!legacyFindings || typeof legacyFindings !== "object") {
      return;
    }

    const nextLegacyFindings = {
      ...legacyFindings,
    };

    if (
      String(nextLegacyFindings.canvasImageData || "").trim() === templateCanvasImage
    ) {
      nextLegacyFindings.canvasImageData = "";
    }

    if (!Array.isArray(nextLegacyFindings.findings)) {
      nextLegacyFindings.findings = [];
    }

    clonedValue[legacyFindingsKey] = nextLegacyFindings;
  };

  compactTemplateDiagramDuplicates(
    "gastroscopy",
    "gastroscopyCanvasData",
    "gastroscopyFindings",
  );
  compactTemplateDiagramDuplicates(
    "colonoscopy",
    "colonoscopyCanvasData",
    "colonoscopyFindings",
  );

  return clonedValue;
};

const showQuotaWarningOnce = (key: string) => {
  if (quotaWarningTracker.has(key)) {
    return;
  }

  quotaWarningTracker.add(key);
  toast.warning(
    "Local storage is full. Continuing with reduced local draft data.",
  );
};

// Save data to localStorage
export const saveToStorage = (key: string, data: any): boolean => {
  try {
    const preparedData = compactKnownReportPayload(key, data);
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const storageData: StorageConfig = {
      key,
      data: preparedData,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(storageData));
    inMemoryStorageFallback.set(storageKey, preparedData);
    return true;
  } catch (error) {
    const preparedData = compactKnownReportPayload(key, data);
    const storageKey = `${STORAGE_PREFIX}${key}`;

    if (isQuotaExceededError(error)) {
      try {
        const reducedData = stripLargeStoragePayload(preparedData);
        const reducedStorageData: StorageConfig = {
          key,
          data: reducedData,
          timestamp: new Date().toISOString(),
          reducedForQuota: true,
        };

        // Replace existing value first to recover space before retry.
        localStorage.removeItem(storageKey);
        localStorage.setItem(storageKey, JSON.stringify(reducedStorageData));
        inMemoryStorageFallback.set(storageKey, reducedData);
        showQuotaWarningOnce(key);
        return true;
      } catch (retryError) {
        inMemoryStorageFallback.set(storageKey, preparedData);
        if (!quotaErrorLogTracker.has(key)) {
          quotaErrorLogTracker.add(key);
          console.warn(
            'Storage quota exceeded; using in-memory fallback for key:',
            key,
            retryError,
          );
        }
        showQuotaWarningOnce(key);
        return false;
      }
    }

    inMemoryStorageFallback.set(storageKey, preparedData);
    console.error('Error saving to storage:', error);
    return false;
  }
};

// Load data from localStorage
export const loadFromStorage = (key: string): any => {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return inMemoryStorageFallback.get(storageKey) ?? null;
    }
    
    const parsedData: StorageConfig = JSON.parse(storedData);
    inMemoryStorageFallback.set(storageKey, parsedData.data);
    return parsedData.data;
  } catch (error) {
    console.error('Error loading from storage:', error);
    const storageKey = `${STORAGE_PREFIX}${key}`;
    return inMemoryStorageFallback.get(storageKey) ?? null;
  }
};

// Clear specific data from localStorage
export const clearFromStorage = (key: string): boolean => {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(storageKey);
    inMemoryStorageFallback.delete(storageKey);
    quotaWarningTracker.delete(key);
    quotaErrorLogTracker.delete(key);
    return true;
  } catch (error) {
    console.error('Error clearing from storage:', error);
    toast.error('Failed to clear data');
    return false;
  }
};

// Clear all app data from localStorage
export const clearAllStorage = (): boolean => {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    keysToRemove.forEach((key) => inMemoryStorageFallback.delete(key));
    quotaWarningTracker.clear();
    quotaErrorLogTracker.clear();
    return true;
  } catch (error) {
    console.error('Error clearing all storage:', error);
    toast.error('Failed to clear all data');
    return false;
  }
};

// Get all saved keys
export const getAllStorageKeys = (): string[] => {
  const keys = new Set<string>();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.add(key.replace(STORAGE_PREFIX, ''));
    }
  }

  inMemoryStorageFallback.forEach((_, key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      keys.add(key.replace(STORAGE_PREFIX, ''));
    }
  });
  
  return Array.from(keys);
};

// Auto-save functionality with debouncing
export const createAutoSave = (key: string, delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (data: any) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveToStorage(key, data);
    }, delay);
  };
};
