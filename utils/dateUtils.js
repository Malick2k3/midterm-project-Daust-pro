import * as hijriConverter from 'hijri-converter';
import { ISLAMIC_MONTHS } from '../constants/prayerNames';
import { GREGORIAN_MONTHS, WEEKDAYS } from '../constants/islamicDates';

/**
 * Format Hijri date from API response
 * @param {Object} hijriObj - Hijri date object from API
 * @returns {string} - Formatted Hijri date
 */
export const formatHijriDate = (hijriObj) => {
  if (!hijriObj) return '';
  
  const { day, month, year } = hijriObj;
  const monthName = ISLAMIC_MONTHS[month.number]?.en || `Month ${month.number}`;
  
  return `${day} ${monthName} ${year}`;
};

/**
 * Format Hijri date with Arabic month name
 * @param {Object} hijriObj - Hijri date object from API
 * @returns {string} - Formatted Hijri date with Arabic
 */
export const formatHijriDateWithArabic = (hijriObj) => {
  if (!hijriObj) return '';
  
  try {

    // Handle both possible API response formats
    const day = hijriObj.day || hijriObj.date;
    const monthNum = hijriObj.month?.number || hijriObj.month;
    const year = hijriObj.year;

    // Validate the data
    if (!day || !monthNum || !year) {
      return '';
    }

    const monthNameEn = ISLAMIC_MONTHS[monthNum]?.en || `Month ${monthNum}`;
    const monthNameAr = ISLAMIC_MONTHS[monthNum]?.ar || '';
    
    return `${day} ${monthNameEn} ${year}${monthNameAr ? ` (${monthNameAr})` : ''}`;
  } catch (error) {
    console.error('Error formatting Hijri date:', error);
    return '';
  }
};

/**
 * Format Gregorian date
 * @param {Date|string} date - Date object or date string
 * @returns {string} - Formatted Gregorian date
 */
export const formatGregorianDate = (dateData) => {
  if (!dateData) return '';
  
  // Handle the API response format
  if (typeof dateData === 'object' && dateData.date) {
    // API returns date in format "DD-MM-YYYY"
    const [day, month, year] = dateData.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const weekday = WEEKDAYS[dateObj.getDay()];
    const monthName = GREGORIAN_MONTHS[dateObj.getMonth()];
    
    return `${weekday}, ${monthName} ${day}, ${year}`;
  }
  
  // Fallback to current date if format is incorrect
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const month = GREGORIAN_MONTHS[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();
  
  return `${weekday}, ${month} ${day}, ${year}`;
};

/**
 * Get Islamic month name
 * @param {number} monthNumber - Month number (1-12)
 * @returns {Object} - { en, ar } month names
 */
export const getIslamicMonth = (monthNumber) => {
  return ISLAMIC_MONTHS[monthNumber] || { en: `Month ${monthNumber}`, ar: '' };
};

/**
 * Get current Hijri year and date information
 * @returns {Object} - Hijri date information { year, month, day }
 */
export const getCurrentHijriDate = () => {
  const now = new Date();
  
  // Convert current Gregorian date to Hijri using the hijri-converter library
  const hijriDate = hijriConverter.toHijri(
    now.getFullYear(),
    now.getMonth() + 1,  // JavaScript months are 0-indexed
    now.getDate()
  );
  
  return {
    year: hijriDate.hy,
    month: hijriDate.hm,
    day: hijriDate.hd
  };
};

/**
 * Format time with AM/PM
 * @param {string} time24 - Time in 24-hour format
 * @returns {string} - Time in 12-hour format
 */
export const formatTime = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get relative date description
 * @param {Date} date - Date to compare
 * @returns {string} - Relative description
 */
export const getRelativeDate = (date) => {
  if (!date) return '';
  
  const now = new Date();
  
  // Reset time portion for accurate day calculation
  const dateNoTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dateNoTime.getTime() - nowNoTime.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    if (diffDays > 30) {
      const months = Math.round(diffDays / 30);
      return `In ${months} month${months > 1 ? 's' : ''}`;
    }
    return `In ${diffDays} days`;
  } else {
    const absDays = Math.abs(diffDays);
    if (absDays > 30) {
      const months = Math.round(absDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    return `${absDays} days ago`;
  }
};

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get days until a specific date
 * @param {Date} targetDate - Target date
 * @returns {number} - Days until target date
 */
export const getDaysUntil = (targetDate) => {
  if (!targetDate) return 0;
  
  const now = new Date();
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const diffTime = target.getTime() - now.getTime();
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
