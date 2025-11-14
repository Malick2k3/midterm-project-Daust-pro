import { API_CONFIG } from '../constants/config';
import { validatePrayerTimes, validateCalculationMethod } from '../utils/validationUtils';
import { loadPrayerTimes, savePrayerTimes, loadLastUpdate, saveLastUpdate } from '../utils/storageUtils';

// Cache and rate limiting
const requestCache = new Map();
const pendingRequests = new Map();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests
const CACHE_DURATION = 3600000; // 1 hour cache

/**
 * Generate cache key for prayer times request
 */
const getCacheKey = (lat, lon, method, date) => {
  return `${lat}_${lon}_${method}_${date}`;
};

/**
 * Fetch prayer times from Aladhan API with caching and rate limiting
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} method - Calculation method ID
 * @returns {Promise<Object|null>} - Prayer times data or null
 */
export const fetchPrayerTimes = async (latitude, longitude, method = API_CONFIG.DEFAULT_METHOD) => {
  try {
    // Ensure coordinates are valid numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates provided');
    }

    if (!validateCalculationMethod(method)) {
      throw new Error('Invalid calculation method');
    }

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const date = `${day}-${month}-${today.getFullYear()}`;
    const cacheKey = getCacheKey(lat, lon, method, date);
    
    // Check in-memory cache first
    const cached = requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    // Check if there's a pending request for the same key
    if (pendingRequests.has(cacheKey)) {
      return await pendingRequests.get(cacheKey);
    }
    
    // Rate limiting - prevent too many requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Check storage cache
    const storedData = await loadPrayerTimes();
    const lastUpdate = await loadLastUpdate();
    if (storedData && lastUpdate && (now - lastUpdate) < CACHE_DURATION) {
      // Verify it's for the same location and method
      const storedKey = getCacheKey(
        storedData.latitude || lat,
        storedData.longitude || lon,
        storedData.method?.id || method,
        date
      );
      if (storedKey === cacheKey) {
        const result = {
          timings: storedData.timings || storedData,
          hijriDate: storedData.hijriDate,
          gregorianDate: storedData.gregorianDate,
          method: storedData.method || { id: method, name: 'ISNA' },
          timezone: storedData.timezone,
          timestamp: lastUpdate,
        };
        requestCache.set(cacheKey, { data: result, timestamp: lastUpdate });
        return result;
      }
    }
    
    // Create promise for pending request
    const requestPromise = (async () => {
      try {
        lastRequestTime = Date.now();
        
        // Remove timestamp to allow proper caching
        const url = `${API_CONFIG.BASE_URL}/timings/${date}?latitude=${lat}&longitude=${lon}&method=${method}`;
        
        const response = await fetch(url, {
          method: 'GET',
          timeout: API_CONFIG.TIMEOUT,
        });

        if (!response.ok) {
          // Handle 429 (Too Many Requests) with backoff
          if (response.status === 429) {
            // Try to return cached data
            if (cached) {
              return cached.data;
            }
            if (storedData) {
              return {
                timings: storedData.timings || storedData,
                hijriDate: storedData.hijriDate,
                gregorianDate: storedData.gregorianDate,
                method: storedData.method || { id: method, name: 'ISNA' },
                timezone: storedData.timezone,
                timestamp: lastUpdate || Date.now(),
              };
            }
            throw new Error('Rate limited. Please try again in a few moments.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.code !== 200) {
          throw new Error(`API error: ${data.status}`);
        }

        const timings = data.data.timings;
        
        // Validate prayer times
        if (!validatePrayerTimes(timings)) {
          throw new Error('Invalid prayer times received');
        }

        const result = {
          timings,
          hijriDate: data.data.date.hijri,
          gregorianDate: data.data.date.gregorian,
          method: data.data.meta.method,
          timezone: data.data.meta.timezone,
          timestamp: Date.now(),
        };
        
        // Cache the result
        requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        // Save to storage
        await savePrayerTimes({
          ...result,
          latitude: lat,
          longitude: lon,
        });
        await saveLastUpdate(Date.now());
        
        return result;
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();
    
    pendingRequests.set(cacheKey, requestPromise);
    return await requestPromise;
    
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    
    // On error, try to return cached data
    const storedData = await loadPrayerTimes();
    if (storedData) {
      return {
        timings: storedData.timings || storedData,
        hijriDate: storedData.hijriDate,
        gregorianDate: storedData.gregorianDate,
        method: storedData.method || { id: method, name: 'ISNA' },
        timezone: storedData.timezone,
        timestamp: storedData.timestamp || Date.now(),
      };
    }
    
    return null;
  }
};

/**
 * Fetch monthly prayer times
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {number} method - Calculation method ID
 * @returns {Promise<Object|null>} - Monthly prayer times or null
 */
export const fetchMonthlyPrayerTimes = async (latitude, longitude, month, year, method = API_CONFIG.DEFAULT_METHOD) => {
  try {
    // Ensure coordinates are valid numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates provided');
    }

    if (!validateCalculationMethod(method)) {
      throw new Error('Invalid calculation method');
    }

    const url = `${API_CONFIG.BASE_URL}/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${method}`;
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: API_CONFIG.TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching monthly prayer times:', error);
    return null;
  }
};

/**
 * Get available calculation methods
 * @returns {Array} - Array of calculation methods
 */
export const getCalculationMethods = () => {
  // Deduplicated and normalized list of Aladhan methods
  return [
    { id: 0, name: 'Shia Ithna-Ansari' },
    { id: 1, name: 'University of Islamic Sciences, Karachi' },
    { id: 2, name: 'Islamic Society of North America (ISNA)' },
    { id: 3, name: 'Muslim World League (MWL)' },
    { id: 4, name: 'Umm al-Qura University, Makkah' },
    { id: 5, name: 'Egyptian General Authority of Survey' },
    { id: 7, name: 'Institute of Geophysics, Univ. of Tehran' },
    { id: 8, name: 'Gulf Region' },
    { id: 9, name: 'Kuwait' },
    { id: 10, name: 'Qatar' },
    { id: 11, name: 'MUIS, Singapore' },
    { id: 12, name: 'UOIF, France' },
    { id: 13, name: 'Diyanet, Turkey' },
    { id: 14, name: 'SAMR, Russia' },
    { id: 15, name: 'Moonsighting Committee Worldwide' },
    { id: 16, name: 'Dubai (unofficial)' },
    { id: 17, name: 'Kuala Lumpur (unofficial)' },
    { id: 18, name: 'Jakarta (unofficial)' },
  ];
};

/**
 * Fetch prayer times with error handling and retry
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} method - Calculation method ID
 * @param {number} retries - Number of retries
 * @returns {Promise<Object|null>} - Prayer times data or null
 */
export const fetchPrayerTimesWithRetry = async (latitude, longitude, method = API_CONFIG.DEFAULT_METHOD, retries = 3) => {
  // Ensure coordinates are valid numbers
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid coordinates provided');
  }

  for (let i = 0; i < retries; i++) {
    try {
      const result = await fetchPrayerTimes(lat, lon, method);
      if (result) {
        return result;
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  return null;
};

/**
 * Check if prayer times are still valid (not expired)
 * @param {Object} prayerData - Prayer times data
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {boolean} - True if data is still valid
 */
export const isPrayerDataValid = (prayerData, maxAge = 3600000) => {
  if (!prayerData || !prayerData.timestamp) {
    return false;
  }
  
  const now = Date.now();
  const dataAge = now - prayerData.timestamp;
  
  return dataAge < maxAge;
};

/**
 * Get prayer times for specific date
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {Date} date - Specific date
 * @param {number} method - Calculation method ID
 * @returns {Promise<Object|null>} - Prayer times for specific date
 */
export const fetchPrayerTimesForDate = async (latitude, longitude, date, method = API_CONFIG.DEFAULT_METHOD) => {
  try {
    // Ensure coordinates are valid numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates provided');
    }

    const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const url = `${API_CONFIG.BASE_URL}/timings/${dateString}?latitude=${lat}&longitude=${lon}&method=${method}`;
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: API_CONFIG.TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error: ${data.status}`);
    }

    const timings = data.data.timings;
    
    if (!validatePrayerTimes(timings)) {
      throw new Error('Invalid prayer times received');
    }

    return {
      timings,
      hijriDate: data.data.date.hijri,
      gregorianDate: data.data.date.gregorian,
      method: data.data.meta.method,
      timezone: data.data.meta.timezone,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching prayer times for date:', error);
    return null;
  }
};
