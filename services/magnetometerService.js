import { Magnetometer } from 'expo-sensors';
import { APP_CONFIG } from '../constants/config';

let magnetometerSubscription = null;
let isCalibrated = false;
let calibrationData = [];
let smoothedHeading = 0;

/**
 * Start magnetometer readings
 * @param {Function} callback - Callback function for heading updates
 * @returns {Promise<Object>} - Subscription object
 */
export const startMagnetometer = async (callback) => {
  try {
    // Check if magnetometer is available
    const isAvailable = await Magnetometer.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Magnetometer not available on this device');
    }

    // Set update interval
    Magnetometer.setUpdateInterval(APP_CONFIG.MAGNETOMETER_UPDATE);

    // Start listening to magnetometer updates
    magnetometerSubscription = Magnetometer.addListener((magnetometerData) => {
      const { x, y, z } = magnetometerData;
      
      // Calculate heading from magnetometer data
      let heading = Math.atan2(y, x) * (180 / Math.PI);
      
      // Convert to 0-360 range
      if (heading < 0) {
        heading += 360;
      }

      // Apply smoothing to reduce jitter
      smoothedHeading = smoothCompassReading(heading, smoothedHeading, 0.1);

      // Collect calibration data
      if (calibrationData.length < 100) {
        calibrationData.push({ x, y, z });
      } else if (!isCalibrated) {
        isCalibrated = true;
        console.log('Compass calibrated');
      }

      // Call the callback with smoothed heading
      callback({
        heading: smoothedHeading,
        rawHeading: heading,
        isCalibrated,
        accuracy: calculateAccuracy(),
        magnetometerData,
      });
    });

    return magnetometerSubscription;
  } catch (error) {
    console.error('Error starting magnetometer:', error);
    throw error;
  }
};

/**
 * Stop magnetometer readings
 * @param {Object} subscription - Magnetometer subscription
 */
export const stopMagnetometer = (subscription) => {
  try {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
    
    if (magnetometerSubscription) {
      magnetometerSubscription.remove();
      magnetometerSubscription = null;
    }
    
    // Reset calibration
    isCalibrated = false;
    calibrationData = [];
    smoothedHeading = 0;
  } catch (error) {
    console.error('Error stopping magnetometer:', error);
  }
};

/**
 * Smooth compass readings to reduce jitter
 * @param {number} newHeading - New heading reading
 * @param {number} previousHeading - Previous heading
 * @param {number} smoothingFactor - Smoothing factor (0-1)
 * @returns {number} - Smoothed heading
 */
const smoothCompassReading = (newHeading, previousHeading, smoothingFactor = 0.1) => {
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

/**
 * Calculate compass accuracy based on calibration data
 * @returns {number} - Accuracy percentage
 */
const calculateAccuracy = () => {
  if (calibrationData.length < 10) {
    return 0;
  }

  // Calculate standard deviation of readings
  const xValues = calibrationData.map(d => d.x);
  const yValues = calibrationData.map(d => d.y);
  const zValues = calibrationData.map(d => d.z);

  const xStdDev = calculateStandardDeviation(xValues);
  const yStdDev = calculateStandardDeviation(yValues);
  const zStdDev = calculateStandardDeviation(zValues);

  const avgStdDev = (xStdDev + yStdDev + zStdDev) / 3;
  
  // Convert to accuracy percentage (lower std dev = higher accuracy)
  const accuracy = Math.max(0, 100 - (avgStdDev * 10));
  return Math.round(accuracy);
};

/**
 * Calculate standard deviation
 * @param {Array} values - Array of values
 * @returns {number} - Standard deviation
 */
const calculateStandardDeviation = (values) => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Calibrate compass by collecting data
 * @returns {Promise<boolean>} - Success status
 */
export const calibrateCompass = async () => {
  try {
    isCalibrated = false;
    calibrationData = [];
    
    // Start collecting calibration data
    const subscription = await startMagnetometer(() => {
      // Data collection happens in the callback
    });

    // Wait for enough calibration data
    return new Promise((resolve) => {
      const checkCalibration = () => {
        if (calibrationData.length >= 50) {
          isCalibrated = true;
          stopMagnetometer(subscription);
          resolve(true);
        } else {
          setTimeout(checkCalibration, 100);
        }
      };
      checkCalibration();
    });
  } catch (error) {
    console.error('Error calibrating compass:', error);
    return false;
  }
};

/**
 * Get compass calibration instructions
 * @returns {Array} - Array of instruction strings
 */
export const getCalibrationInstructions = () => {
  return [
    'Hold your device flat',
    'Move it in a figure-8 pattern',
    'Rotate it slowly in all directions',
    'Continue for about 30 seconds',
    'Keep the device level throughout'
  ];
};

/**
 * Check if compass is calibrated
 * @returns {boolean} - True if calibrated
 */
export const isCompassCalibrated = () => {
  return isCalibrated;
};

/**
 * Get current compass status
 * @returns {Object} - Compass status object
 */
export const getCompassStatus = () => {
  return {
    isCalibrated,
    calibrationDataCount: calibrationData.length,
    smoothedHeading,
    accuracy: calculateAccuracy(),
  };
};

/**
 * Reset compass calibration
 */
export const resetCompassCalibration = () => {
  isCalibrated = false;
  calibrationData = [];
  smoothedHeading = 0;
};
