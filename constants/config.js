export const API_CONFIG = {
  BASE_URL: 'https://api.aladhan.com/v1',
  TIMEOUT: 10000,
  DEFAULT_METHOD: 2, // ISNA
};

export const MECCA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

export const APP_CONFIG = {
  UPDATE_INTERVAL: 60000, // 1 minute
  MAGNETOMETER_UPDATE: 100, // 100ms
  VIBRATION_DURATION: 50,
  COMPASS_SIZE: 280,
  TASBIH_TARGETS: [33, 99, 100],
};

export const STORAGE_KEYS = {
  USER_LOCATION: 'userLocation',
  PRAYER_TIMES: 'prayerTimes',
  TASBIH_COUNT: 'tasbihCount',
  CALCULATION_METHOD: 'calculationMethod',
  NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  LAST_UPDATE: 'lastUpdate',
  THEME: 'theme',
};

export const PRAYER_ORDER = [
  'Fajr',
  'Sunrise', 
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha'
];
