import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import NextPrayerCard from '../components/NextPrayerCard';
import PrayerCard from '../components/PrayerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Colors } from '../constants/colors';

import { getLocationWithCity, getCityName } from '../services/locationService';
import { fetchPrayerTimes } from '../services/prayerTimesApi';
import { loadCalculationMethod } from '../utils/storageUtils';
import { requestNotificationPermission, schedulePrayerNotifications, areNotificationsEnabled } from '../services/notificationService';
import { savePrayerTimes, loadPrayerTimes } from '../utils/storageUtils';
import { findNextPrayer, formatTime12Hour } from '../utils/timeUtils';
import { formatHijriDateWithArabic, formatGregorianDate } from '../utils/dateUtils';
import { PRAYER_ORDER } from '../constants/config';
import { useTheme } from '../contexts/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Try to load cached data first to prevent showing errors unnecessarily
      const cachedPrayerTimes = await loadPrayerTimes();
      if (cachedPrayerTimes && cachedPrayerTimes.timings) {
        setPrayerTimes(cachedPrayerTimes.timings);
        if (cachedPrayerTimes.hijriDate) {
          setHijriDate(formatHijriDateWithArabic(cachedPrayerTimes.hijriDate));
        }
        if (cachedPrayerTimes.gregorianDate) {
          setGregorianDate(formatGregorianDate(cachedPrayerTimes.gregorianDate));
        }
        const next = findNextPrayer(cachedPrayerTimes.timings);
        setNextPrayer(next);
      }
      
      // Get location
      const locationData = await getLocationWithCity();
      if (!locationData) {
        // Only throw error if we don't have cached data
        if (!cachedPrayerTimes || !cachedPrayerTimes.timings) {
          throw new Error('Unable to get your location. Please check location permissions.');
        }
        // If we have cached data, just return without error
        return;
      }
      
      // Normalize coordinates before storing in state
      const normalizedLocationData = {
        ...locationData,
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
      };
      setLocation(normalizedLocationData);
      // If city is unknown, try a secondary reverse-geocode attempt for a better label
      if (!locationData.cityName || locationData.cityName === 'Unknown Location') {
        try {
          const lat = parseFloat(locationData.latitude);
          const lon = parseFloat(locationData.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            const fallbackCity = await getCityName(lat, lon);
            if (fallbackCity && fallbackCity !== 'Unknown Location') {
              setLocation(prev => ({ ...prev, cityName: fallbackCity }));
            }
          }
        } catch (e) {
          // ignore fallback failures
          console.warn('City fallback failed:', e);
        }
      }

      // Determine calculation method (use saved method if available)
      const savedMethod = await loadCalculationMethod();
      const effectiveMethod = typeof savedMethod === 'number' ? savedMethod : undefined;

      // Fetch prayer times - ensure coordinates are numbers
      const lat = parseFloat(locationData.latitude);
      const lon = parseFloat(locationData.longitude);
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid location coordinates');
      }
      
      const prayerData = await fetchPrayerTimes(
        lat,
        lon,
        effectiveMethod
      );
      
      if (!prayerData) {
        // Only throw error if we don't have cached data
        if (!cachedPrayerTimes || !cachedPrayerTimes.timings) {
          throw new Error('Unable to fetch prayer times. Please check your internet connection.');
        }
        // If we have cached data, just return without error
        return;
      }

      setPrayerTimes(prayerData.timings);
      await savePrayerTimes(prayerData.timings);
      setHijriDate(formatHijriDateWithArabic(prayerData.hijriDate));
      // Handle both API response format and cached format
      const gregorianDateData = prayerData.gregorianDate?.date 
        ? { date: prayerData.gregorianDate.date } 
        : prayerData.gregorianDate;
      setGregorianDate(formatGregorianDate(gregorianDateData));

      // Find next prayer
      const next = findNextPrayer(prayerData.timings);
      setNextPrayer(next);

      // Notifications: request permission once and schedule (don't let errors here break the app)
      try {
        const hasPermission = await areNotificationsEnabled();
        if (!hasPermission) {
          await requestNotificationPermission();
        }
        const enabledNow = await areNotificationsEnabled();
        if (enabledNow) {
          await schedulePrayerNotifications(prayerData.timings);
        }
      } catch (notifError) {
        // Silently fail notifications - they're not critical
        console.warn('Notification setup failed:', notifError);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      // Only set error if we don't have any cached data to show
      const hasCachedData = await loadPrayerTimes();
      if (!hasCachedData || !hasCachedData.timings) {
        setError(err.message);
      } else {
        // We have cached data, so don't show error - just log it
        console.warn('Using cached data due to error:', err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleLocationPress = () => {
    setLocationModalVisible(true);
  };

  const handlePrayerPress = (prayerName) => {
    navigation.navigate('Prayers');
  };

  useEffect(() => {
    // Try cached prayer times for quicker initial UI while fetching fresh data
    (async () => {
      const cached = await loadPrayerTimes();
      if (cached) {
        setPrayerTimes(cached);
        const next = findNextPrayer(cached);
        setNextPrayer(next);
      }
      loadData();
    })();
  }, [loadData]);

  // Update countdown every minute
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      const next = findNextPrayer(prayerTimes);
      setNextPrayer(next);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [prayerTimes]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Daust Pro" subtitle="Prayer times, Qibla, and daily essentials" />
        <LoadingSpinner message="Loading prayer times..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Daust Pro" subtitle="Prayer times, Qibla, and daily essentials" />
        <ErrorMessage message={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}
        subtitle={
          location ? (
            (location.cityName && location.cityName !== 'Unknown Location') ?
              location.cityName : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
          ) : 'Loading...'
        }
        rightButton={
          <TouchableOpacity onPress={handleLocationPress}>
            <Ionicons name="location-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Date Display */}
        <View style={[styles.dateContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.hijriDate, { color: colors.text }]}>{hijriDate}</Text>
          <Text style={[styles.gregorianDate, { color: colors.textSecondary }]}>{gregorianDate}</Text>
        </View>

        {/* Next Prayer Card */}
        {nextPrayer && (
          <NextPrayerCard
            prayerName={nextPrayer.name}
            time={formatTime12Hour(nextPrayer.time)}
            countdown={nextPrayer.timeUntil.formatted}
          />
        )}

        {/* Prayer Times List */}
        <View style={styles.prayerTimesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Prayer Times</Text>
          {PRAYER_ORDER.map((prayerName) => {
            if (!prayerTimes[prayerName]) return null;
            
            return (
              <PrayerCard
                key={prayerName}
                prayerName={prayerName}
                time={prayerTimes[prayerName]}
                isNext={nextPrayer?.name === prayerName}
                onPress={() => handlePrayerPress(prayerName)}
              />
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Qibla')}
            >
              <Ionicons name="compass" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Qibla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Tasbih')}
            >
              <Ionicons name="ellipse" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Tasbih</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Calendar')}
            >
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
        <View style={[styles.locationModal, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setLocationModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>Current Location</Text>
            
            <View style={styles.locationInfo}>
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>City</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {location && location.cityName && location.cityName !== 'Unknown Location'
                      ? location.cityName
                      : location
                        ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                        : 'Unknown'
                    }
                  </Text>
                </View>
              </View>

              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Time</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <Ionicons name="map" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Coordinates</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Loading...'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: colors.primary }]}
              onPress={() => setLocationModalVisible(false)}
            >
              <Text style={[styles.closeModalButtonText, { color: colors.textWhite }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  dateContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hijriDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: 14,
  },
  prayerTimesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  quickActionsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModal: {
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationInfo: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
