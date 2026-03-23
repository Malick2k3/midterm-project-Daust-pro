import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

/**
 * Save data to AsyncStorage
 * @param {string} key - Storage key
 * @param {any} value - Data to save (will be JSON stringified)
 * @returns {Promise<boolean>} - Success status
 */
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

/**
 * Load data from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<any>} - Parsed data or null if not found
 */
export const loadData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

/**
 * Remove specific data from AsyncStorage
 * @param {string} key - Storage key to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

/**
 * Clear all data from AsyncStorage
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Get multiple items from AsyncStorage
 * @param {string[]} keys - Array of keys to retrieve
 * @returns {Promise<Object>} - Object with key-value pairs
 */
export const getMultipleData = async (keys) => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    const result = {};
    values.forEach(([key, value]) => {
      result[key] = value != null ? JSON.parse(value) : null;
    });
    return result;
  } catch (error) {
    console.error('Error getting multiple data:', error);
    return {};
  }
};

/**
 * Save multiple items to AsyncStorage
 * @param {Object} data - Object with key-value pairs to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveMultipleData = async (data) => {
  try {
    const pairs = Object.entries(data).map(([key, value]) => [
      key,
      JSON.stringify(value)
    ]);
    await AsyncStorage.multiSet(pairs);
    return true;
  } catch (error) {
    console.error('Error saving multiple data:', error);
    return false;
  }
};

// Convenience functions for specific data types
// Ensure coordinates are stored/returned as numbers to avoid native type cast issues
export const saveUserLocation = async (location) => {
  if (!location) return await saveData(STORAGE_KEYS.USER_LOCATION, location);
  const normalized = {
    ...location,
    latitude: location.latitude != null ? parseFloat(location.latitude) : location.latitude,
    longitude: location.longitude != null ? parseFloat(location.longitude) : location.longitude,
  };
  // Validate before saving
  if (isNaN(normalized.latitude) || isNaN(normalized.longitude)) {
    console.warn('Invalid coordinates detected, not saving to storage');
    return false;
  }
  return await saveData(STORAGE_KEYS.USER_LOCATION, normalized);
};

export const loadUserLocation = async () => {
  const data = await loadData(STORAGE_KEYS.USER_LOCATION);
  if (!data) return null;
  
  const lat = data.latitude != null ? parseFloat(data.latitude) : null;
  const lon = data.longitude != null ? parseFloat(data.longitude) : null;
  
  // If coordinates are invalid, clear the cached data
  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    console.warn('Invalid cached location data detected, clearing cache');
    await removeData(STORAGE_KEYS.USER_LOCATION);
    return null;
  }
  
  return {
    ...data,
    latitude: lat,
    longitude: lon,
  };
};

/**
 * Clear invalid cached location data
 * @returns {Promise<boolean>} - Success status
 */
export const clearInvalidLocationCache = async () => {
  try {
    const location = await loadUserLocation();
    if (location) {
      const lat = parseFloat(location.latitude);
      const lon = parseFloat(location.longitude);
      if (isNaN(lat) || isNaN(lon)) {
        await removeData(STORAGE_KEYS.USER_LOCATION);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error clearing invalid location cache:', error);
    return false;
  }
};

export const savePrayerTimes = (prayerTimes) => saveData(STORAGE_KEYS.PRAYER_TIMES, prayerTimes);
export const loadPrayerTimes = () => loadData(STORAGE_KEYS.PRAYER_TIMES);

export const saveTasbihCount = (count) => saveData(STORAGE_KEYS.TASBIH_COUNT, count);
export const loadTasbihCount = () => loadData(STORAGE_KEYS.TASBIH_COUNT);

export const saveCalculationMethod = (method) => saveData(STORAGE_KEYS.CALCULATION_METHOD, method);
export const loadCalculationMethod = () => loadData(STORAGE_KEYS.CALCULATION_METHOD);

export const saveNotificationsEnabled = (enabled) => saveData(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled);
export const loadNotificationsEnabled = () => loadData(STORAGE_KEYS.NOTIFICATIONS_ENABLED);

export const saveLastUpdate = (timestamp) => saveData(STORAGE_KEYS.LAST_UPDATE, timestamp);
export const loadLastUpdate = () => loadData(STORAGE_KEYS.LAST_UPDATE);

export const saveTheme = (theme) => saveData(STORAGE_KEYS.THEME, theme);
export const loadTheme = () => loadData(STORAGE_KEYS.THEME);

export const saveQuranSurahList = (surahList) => saveData(STORAGE_KEYS.QURAN_SURAH_LIST, surahList);
export const loadQuranSurahList = () => loadData(STORAGE_KEYS.QURAN_SURAH_LIST);

export const saveQuranSurahDetail = (surahNumber, detail) => {
  if (!surahNumber) return false;
  return saveData(`${STORAGE_KEYS.QURAN_SURAH_DETAIL_PREFIX}${surahNumber}`, detail);
};

export const loadQuranSurahDetail = (surahNumber) => {
  if (!surahNumber) return null;
  return loadData(`${STORAGE_KEYS.QURAN_SURAH_DETAIL_PREFIX}${surahNumber}`);
};
