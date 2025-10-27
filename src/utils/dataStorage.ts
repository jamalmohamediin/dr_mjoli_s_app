// Data persistence utility for saving and loading form data
import { toast } from 'sonner';

const STORAGE_PREFIX = 'endoscopy_app_';

export interface StorageConfig {
  key: string;
  data: any;
  timestamp?: string;
}

// Save data to localStorage
export const saveToStorage = (key: string, data: any): boolean => {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const storageData: StorageConfig = {
      key,
      data,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    toast.error('Failed to save data');
    return false;
  }
};

// Load data from localStorage
export const loadFromStorage = (key: string): any => {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      return null;
    }
    
    const parsedData: StorageConfig = JSON.parse(storedData);
    return parsedData.data;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return null;
  }
};

// Clear specific data from localStorage
export const clearFromStorage = (key: string): boolean => {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(storageKey);
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
    return true;
  } catch (error) {
    console.error('Error clearing all storage:', error);
    toast.error('Failed to clear all data');
    return false;
  }
};

// Get all saved keys
export const getAllStorageKeys = (): string[] => {
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key.replace(STORAGE_PREFIX, ''));
    }
  }
  
  return keys;
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