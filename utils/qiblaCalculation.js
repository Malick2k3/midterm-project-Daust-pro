import { MECCA_COORDS } from '../constants/config';

/**
 * Calculate Qibla direction using Haversine formula
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {number} - Bearing angle in degrees (0-360)
 */
export const calculateQiblaDirection = (userLat, userLon) => {
  // Ensure coordinates are numbers
  const lat = parseFloat(userLat);
  const lon = parseFloat(userLon);
  
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid coordinates for Qibla calculation');
  }
  
  const lat1 = (lat * Math.PI) / 180;
  const lat2 = (MECCA_COORDS.latitude * Math.PI) / 180;
  const deltaLon = ((MECCA_COORDS.longitude - lon) * Math.PI) / 180;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return Math.round(bearing);
};

/**
 * Calculate distance to Mecca using Haversine formula
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {number} - Distance in kilometers
 */
export const getDistanceToMecca = (userLat, userLon) => {
  // Ensure coordinates are numbers
  const lat = parseFloat(userLat);
  const lon = parseFloat(userLon);
  
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid coordinates for distance calculation');
  }
  
  const R = 6371; // Earth's radius in kilometers
  const lat1 = (lat * Math.PI) / 180;
  const lat2 = (MECCA_COORDS.latitude * Math.PI) / 180;
  const deltaLat = lat2 - lat1;
  const deltaLon = ((MECCA_COORDS.longitude - lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Get Qibla compass direction relative to device heading
 * @param {number} qiblaBearing - Qibla bearing angle
 * @param {number} deviceHeading - Device compass heading
 * @returns {number} - Relative direction for compass needle
 */
export const getQiblaCompassDirection = (qiblaBearing, deviceHeading) => {
  let relativeDirection = qiblaBearing - deviceHeading;
  
  // Normalize to 0-360 range
  if (relativeDirection < 0) {
    relativeDirection += 360;
  }
  if (relativeDirection >= 360) {
    relativeDirection -= 360;
  }
  
  return relativeDirection;
};

/**
 * Get cardinal direction from bearing angle
 * @param {number} bearing - Bearing angle in degrees
 * @returns {string} - Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
export const getCardinalDirection = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

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
 * Calculate compass accuracy based on device capabilities
 * @param {number} heading - Current heading
 * @param {number} accuracy - Device accuracy
 * @returns {string} - Accuracy level description
 */
export const getCompassAccuracy = (heading, accuracy) => {
  if (accuracy < 10) {
    return 'Excellent';
  } else if (accuracy < 20) {
    return 'Good';
  } else if (accuracy < 45) {
    return 'Fair';
  } else {
    return 'Poor';
  }
};

/**
 * Smooth compass readings to reduce jitter
 * @param {number} newHeading - New heading reading
 * @param {number} previousHeading - Previous heading
 * @param {number} smoothingFactor - Smoothing factor (0-1)
 * @returns {number} - Smoothed heading
 */
export const smoothCompassReading = (newHeading, previousHeading, smoothingFactor = 0.1) => {
  if (previousHeading === null || previousHeading === undefined) {
    return newHeading;
  }

  let diff = newHeading - previousHeading;
  
  // Handle wraparound at 0/360 degrees
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }

  return previousHeading + diff * smoothingFactor;
};
