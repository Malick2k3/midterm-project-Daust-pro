/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} - True if coordinates are valid
 */
export const validateCoordinates = (lat, lon) => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !isNaN(lat) &&
    !isNaN(lon)
  );
};

/**
 * Validate prayer times object
 * @param {Object} timings - Prayer times object
 * @returns {boolean} - True if prayer times are valid
 */
export const validatePrayerTimes = (timings) => {
  if (!timings || typeof timings !== 'object') {
    return false;
  }

  const requiredPrayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  for (const prayer of requiredPrayers) {
    if (!timings[prayer] || !isValidTime(timings[prayer])) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validate time string format
 * @param {string} timeString - Time in HH:MM format
 * @returns {boolean} - True if time format is valid
 */
export const isValidTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    return false;
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Validate city name
 * @param {string} cityName - City name
 * @returns {boolean} - True if city name is valid
 */
export const validateCityName = (cityName) => {
  return (
    typeof cityName === 'string' &&
    cityName.trim().length > 0 &&
    cityName.trim().length <= 100
  );
};

/**
 * Validate calculation method ID
 * @param {number} methodId - Calculation method ID
 * @returns {boolean} - True if method ID is valid
 */
export const validateCalculationMethod = (methodId) => {
  return (
    typeof methodId === 'number' &&
    methodId >= 0 &&
    methodId <= 20 &&
    !isNaN(methodId)
  );
};

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate tasbih count
 * @param {number} count - Count value
 * @returns {boolean} - True if count is valid
 */
export const validateTasbihCount = (count) => {
  return (
    typeof count === 'number' &&
    count >= 0 &&
    count <= 999999 &&
    !isNaN(count) &&
    Number.isInteger(count)
  );
};

/**
 * Validate notification settings
 * @param {Object} settings - Notification settings
 * @returns {boolean} - True if settings are valid
 */
export const validateNotificationSettings = (settings) => {
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  
  const validKeys = ['enabled', 'sound', 'vibration'];
  
  for (const key of validKeys) {
    if (key in settings && typeof settings[key] !== 'boolean') {
      return false;
    }
  }
  
  return true;
};
