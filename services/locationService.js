import * as Location from 'expo-location';
import { saveUserLocation, loadUserLocation, clearInvalidLocationCache } from '../utils/storageUtils';
import { validateCoordinates } from '../utils/validationUtils';

/**
 * Request location permission from user
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location coordinates
 * @returns {Promise<Object|null>} - Location object or null
 */
export const getCurrentLocation = async () => {
  try {
    // Clear any invalid cached location data first
    await clearInvalidLocationCache();
    
    // Check if permission is granted
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000,
    });

    // Ensure all numeric values are properly converted to numbers
    const lat = parseFloat(location.coords.latitude);
    const lon = parseFloat(location.coords.longitude);
    const acc = parseFloat(location.coords.accuracy);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates received from location service');
    }

    const coords = {
      latitude: lat,
      longitude: lon,
      accuracy: isNaN(acc) ? 0 : acc,
      timestamp: location.timestamp,
    };

    // Validate coordinates
    if (!validateCoordinates(coords.latitude, coords.longitude)) {
      throw new Error('Invalid coordinates received');
    }

    // Save to storage
    await saveUserLocation(coords);

    return coords;
  } catch (error) {
    console.error('Error getting current location:', error);
    
    // Try to return cached location
    const cachedLocation = await loadUserLocation();
    if (cachedLocation) {
      const lat = parseFloat(cachedLocation.latitude);
      const lon = parseFloat(cachedLocation.longitude);
      if (!isNaN(lat) && !isNaN(lon) && validateCoordinates(lat, lon)) {
        return {
          ...cachedLocation,
          latitude: lat,
          longitude: lon,
        };
      }
    }
    
    return null;
  }
};

/**
 * Get city name from coordinates using reverse geocoding
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string|null>} - City name or null
 */
export const getCityName = async (latitude, longitude) => {
  try {
    // Ensure coordinates are valid numbers before calling native module
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates for reverse geocoding');
    }

    // Validate coordinates are within valid ranges
    if (!validateCoordinates(lat, lon)) {
      throw new Error('Invalid coordinates');
    }

    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });


    if (reverseGeocode.length > 0) {
      const location = reverseGeocode[0];
      const city = location.city || location.subregion || location.region || location.country;
      const resolved = city || 'Unknown Location';
      return resolved;
    }

    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting city name:', error);
    return 'Unknown Location';
  }
};

/**
 * Watch location changes (for Qibla screen)
 * @param {Function} callback - Callback function for location updates
 * @returns {Promise<Object>} - Location subscription object
 */
export const watchLocation = async (callback) => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        // Ensure all numeric values are properly converted to numbers
        const lat = parseFloat(location.coords.latitude);
        const lon = parseFloat(location.coords.longitude);
        const acc = parseFloat(location.coords.accuracy);

        if (!isNaN(lat) && !isNaN(lon) && validateCoordinates(lat, lon)) {
          const coords = {
            latitude: lat,
            longitude: lon,
            accuracy: isNaN(acc) ? 0 : acc,
            timestamp: location.timestamp,
          };
          callback(coords);
        }
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    throw error;
  }
};

/**
 * Stop watching location changes
 * @param {Object} subscription - Location subscription object
 */
export const stopWatchingLocation = (subscription) => {
  if (subscription && subscription.remove) {
    subscription.remove();
  }
};

/**
 * Get location with city name
 * @returns {Promise<Object|null>} - Location object with city name
 */
export const getLocationWithCity = async () => {
  try {
    const location = await getCurrentLocation();
    if (!location) {
      return null;
    }

    // Ensure coordinates are numbers before passing to getCityName
    const lat = parseFloat(location.latitude);
    const lon = parseFloat(location.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid location coordinates');
    }

    const cityName = await getCityName(lat, lon);
    
    // Normalize numeric types to avoid strings reaching native modules
    return {
      ...location,
      latitude: lat,
      longitude: lon,
      cityName,
    };
  } catch (error) {
    console.error('Error getting location with city:', error);
    return null;
  }
};

/**
 * Check if location services are enabled
 * @returns {Promise<boolean>} - True if location services are enabled
 */
export const isLocationEnabled = async () => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

/**
 * Get last known location from cache
 * @returns {Promise<Object|null>} - Cached location or null
 */
export const getLastKnownLocation = async () => {
  try {
    const cachedLocation = await loadUserLocation();
    if (cachedLocation) {
      const lat = parseFloat(cachedLocation.latitude);
      const lon = parseFloat(cachedLocation.longitude);
      if (!isNaN(lat) && !isNaN(lon) && validateCoordinates(lat, lon)) {
        return {
          ...cachedLocation,
          latitude: lat,
          longitude: lon,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting last known location:', error);
    return null;
  }
};
