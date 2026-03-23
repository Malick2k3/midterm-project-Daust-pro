import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { PRAYER_NAMES } from '../constants/prayerNames';

// Lazy initialization flag
let notificationHandlerInitialized = false;

/**
 * Initialize notification handler (called lazily to avoid TurboModuleRegistry errors)
 */
const initializeNotificationHandler = () => {
  if (!notificationHandlerInitialized) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          // `shouldShowAlert` is deprecated; use shouldShowBanner and shouldShowList
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      notificationHandlerInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize notification handler:', error);
    }
  }
};

/**
 * Request notification permission
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    initializeNotificationHandler();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Schedule prayer notifications
 * @param {Object} prayerTimes - Prayer times object
 * @returns {Promise<boolean>} - Success status
 */
export const schedulePrayerNotifications = async (prayerTimes) => {
  try {
    initializeNotificationHandler();
    // Validate input early to avoid TypeError: Cannot convert null value to object
    if (!prayerTimes || typeof prayerTimes !== 'object') {
      console.warn('schedulePrayerNotifications called with invalid prayerTimes:', prayerTimes);
      return false;
    }

    // Cancel all existing notifications first
    await cancelAllNotifications();

    const notifications = [];
    const today = new Date();
    
    // Schedule notifications for each prayer
    Object.entries(prayerTimes || {}).forEach(([prayerName, time]) => {
      if (prayerName === 'Sunrise') return; // Skip sunrise notification
      
      const prayerInfo = PRAYER_NAMES[prayerName];
      if (!prayerInfo) return;

  // Ensure hours/minutes are numbers. Prayer API should return 'HH:MM' but guard against unexpected formats.
  const timeParts = String(time || '').split(':');
  const hours = Number(timeParts[0]) || 0;
  const minutes = Number(timeParts[1]) || 0;
      const notificationTime = new Date(today);
      notificationTime.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (notificationTime <= today) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      // Ensure trigger date is a Date object
      if (!(notificationTime instanceof Date) || isNaN(notificationTime.getTime())) {
        console.warn('notificationTime is not a valid Date, skipping:', notificationTime);
        return;
      }

      // Calculate seconds until notification (use seconds-based trigger for cross-platform compatibility)
      const nowMs = Date.now();
      const notificationMs = notificationTime.getTime();
      let secondsUntil = Math.ceil((notificationMs - nowMs) / 1000);
      if (secondsUntil < 1) secondsUntil = 1; // minimum 1 second

      const trigger = { seconds: secondsUntil };

      notifications.push({
        content: {
          title: `${prayerInfo.en} Prayer Time`,
          body: `It's time for ${prayerInfo.en} prayer`,
          sound: 'default',
          data: { prayer: prayerName },
        },
        trigger,
      });
    });

    // Schedule all notifications
    for (const notification of notifications) {
      try {
        await Notifications.scheduleNotificationAsync(notification);
      } catch (e) {
        console.error('Failed to schedule notification:', e, notification);
      }
    }
    return true;
  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
    return false;
  }
};

/**
 * Schedule a single prayer notification
 * @param {string} prayer - Prayer name
 * @param {string} time - Prayer time
 * @param {Date} date - Date for notification
 * @returns {Promise<string|null>} - Notification ID or null
 */
export const scheduleAdhanNotification = async (prayer, time, date) => {
  try {
    initializeNotificationHandler();
    const prayerInfo = PRAYER_NAMES[prayer];
    if (!prayerInfo) {
      throw new Error('Invalid prayer name');
    }

    // Coerce date to a valid Date object
    let triggerDate = date instanceof Date ? date : new Date(date);
    if (!(triggerDate instanceof Date) || isNaN(triggerDate.getTime())) {
      console.warn('scheduleAdhanNotification called with invalid date:', date);
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayerInfo.en} Prayer Time`,
        body: `It's time for ${prayerInfo.en} prayer`,
        sound: 'default',
        data: { prayer },
      },
      trigger: triggerDate,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling adhan notification:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 * @returns {Promise<boolean>} - Success status
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
};

/**
 * Cancel specific notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} - Success status
 */
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error canceling notification:', error);
    return false;
  }
};

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>} - Array of scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Handle notification tap
 * @param {Function} callback - Callback function
 */
export const handleNotificationTap = (callback) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
};

/**
 * Handle notification received while app is open
 * @param {Function} callback - Callback function
 */
export const handleNotificationReceived = (callback) => {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

/**
 * Trigger haptic feedback
 * @param {string} type - Haptic type ('light', 'medium', 'heavy')
 */
export const triggerHaptic = async (type = 'light') => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.error('Error triggering haptic:', error);
  }
};

/**
 * Check if notifications are enabled
 * @returns {Promise<boolean>} - True if notifications are enabled
 */
export const areNotificationsEnabled = async () => {
  try {
    initializeNotificationHandler();
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};
