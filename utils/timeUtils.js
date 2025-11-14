/**
 * Format 24-hour time to 12-hour format
 * @param {string} time24 - Time in HH:MM format
 * @returns {string} - Time in 12-hour format (e.g., "1:45 PM")
 */
export const formatTime12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format 24-hour time to 24-hour format (ensures proper formatting)
 * @param {string} time24 - Time in HH:MM format
 * @returns {string} - Properly formatted 24-hour time
 */
export const formatTime24Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get current time in minutes since midnight
 * @returns {number} - Current time in minutes
 */
export const getCurrentTimeInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/**
 * Convert time string to minutes since midnight
 * @param {string} timeString - Time in HH:MM format
 * @returns {number} - Time in minutes since midnight
 */
export const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - Time in HH:MM format
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if a prayer time has passed
 * @param {string} prayerTime - Prayer time in HH:MM format
 * @returns {boolean} - True if prayer time has passed
 */
export const isPrayerTimePassed = (prayerTime) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const prayerMinutes = timeToMinutes(prayerTime);
  return currentMinutes > prayerMinutes;
};

/**
 * Calculate time until next prayer
 * @param {string} prayerTime - Prayer time in HH:MM format
 * @returns {Object} - { hours, minutes, totalMinutes, formatted }
 */
export const getTimeUntilPrayer = (prayerTime) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const prayerMinutes = timeToMinutes(prayerTime);
  
  let totalMinutes;
  
  if (prayerMinutes > currentMinutes) {
    // Prayer is today
    totalMinutes = prayerMinutes - currentMinutes;
  } else {
    // Prayer is tomorrow
    totalMinutes = (24 * 60) - currentMinutes + prayerMinutes;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return {
    hours,
    minutes,
    totalMinutes,
    formatted: `${hours}h ${minutes}m`
  };
};

/**
 * Find the next upcoming prayer
 * @param {Object} prayerTimes - Object with prayer times
 * @returns {Object|null} - Next prayer info or null
 */
export const findNextPrayer = (prayerTimes) => {
  if (!prayerTimes) return null;
  
  const currentMinutes = getCurrentTimeInMinutes();
  const prayers = [
    { name: 'Fajr', time: prayerTimes.Fajr },
    { name: 'Sunrise', time: prayerTimes.Sunrise },
    { name: 'Dhuhr', time: prayerTimes.Dhuhr },
    { name: 'Asr', time: prayerTimes.Asr },
    { name: 'Maghrib', time: prayerTimes.Maghrib },
    { name: 'Isha', time: prayerTimes.Isha },
  ];
  
  // Find next prayer today
  for (const prayer of prayers) {
    const prayerMinutes = timeToMinutes(prayer.time);
    if (prayerMinutes > currentMinutes) {
      return {
        name: prayer.name,
        time: prayer.time,
        timeUntil: getTimeUntilPrayer(prayer.time)
      };
    }
  }
  
  // If no prayer found today, return first prayer tomorrow (Fajr)
  const fajrMinutes = timeToMinutes(prayerTimes.Fajr);
  const hoursUntilFajr = Math.floor(((24 * 60) - currentMinutes + fajrMinutes) / 60);
  const minutesUntilFajr = ((24 * 60) - currentMinutes + fajrMinutes) % 60;
  
  return {
    name: 'Fajr',
    time: prayerTimes.Fajr,
    timeUntil: {
      hours: hoursUntilFajr,
      minutes: minutesUntilFajr,
      totalMinutes: (24 * 60) - currentMinutes + fajrMinutes,
      formatted: `${hoursUntilFajr}h ${minutesUntilFajr}m`
    }
  };
};

/**
 * Format duration in a human-readable way
 * @param {number} totalMinutes - Total minutes
 * @returns {string} - Formatted duration
 */
export const formatDuration = (totalMinutes) => {
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

/**
 * Get time zone offset in minutes
 * @returns {number} - Time zone offset in minutes
 */
export const getTimezoneOffset = () => {
  return new Date().getTimezoneOffset();
};

/**
 * Check if it's currently prayer time (within 5 minutes)
 * @param {string} prayerTime - Prayer time in HH:MM format
 * @returns {boolean} - True if within prayer time window
 */
export const isPrayerTimeNow = (prayerTime) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const prayerMinutes = timeToMinutes(prayerTime);
  const diff = Math.abs(currentMinutes - prayerMinutes);
  
  // Consider it prayer time if within 5 minutes
  return diff <= 5;
};
