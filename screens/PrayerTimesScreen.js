import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import PrayerCard from '../components/PrayerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { getLocationWithCity } from '../services/locationService';
import { fetchPrayerTimes, getCalculationMethods } from '../services/prayerTimesApi';
import { saveCalculationMethod, loadCalculationMethod, saveUserLocation, loadPrayerTimes } from '../utils/storageUtils';
import { findNextPrayer, formatTime12Hour } from '../utils/timeUtils';
import { formatHijriDateWithArabic, formatGregorianDate } from '../utils/dateUtils';
import { PRAYER_ORDER } from '../constants/config';
import { useTheme } from '../contexts/ThemeContext';

const PrayerTimesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  // Start with loading=false so the first loadData() call runs (guard prevents running when loading===true)
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  // initialize to empty object so render can safely index into it without throwing
  const [prayerTimes, setPrayerTimes] = useState({});
  const [nextPrayer, setNextPrayer] = useState(null);
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('ISNA');
  const [methodId, setMethodId] = useState(null);
  const [methods, setMethods] = useState([]);
  const [methodPickerVisible, setMethodPickerVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [useAutoLocation, setUseAutoLocation] = useState(true);
  
  // Use ref to store loadData function to prevent infinite loops
  const loadDataRef = useRef();
  
  // Predefined cities list with coordinates
  const PREDEFINED_CITIES = [
    { name: 'Mecca, Saudi Arabia', latitude: 21.4225, longitude: 39.8262 },
    { name: 'Medina, Saudi Arabia', latitude: 24.5247, longitude: 39.5692 },
    { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708 },
    { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357 },
    { name: 'Istanbul, Turkey', latitude: 41.0082, longitude: 28.9784 },
    { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
    { name: 'New York, USA', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Toronto, Canada', latitude: 43.6532, longitude: -79.3832 },
    { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093 },
    { name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
    { name: 'Kuala Lumpur, Malaysia', latitude: 3.1390, longitude: 101.6869 },
    { name: 'Jakarta, Indonesia', latitude: -6.2088, longitude: 106.8456 },
    { name: 'Karachi, Pakistan', latitude: 24.8607, longitude: 67.0011 },
    { name: 'Delhi, India', latitude: 28.7041, longitude: 77.1025 },
    { name: 'Dhaka, Bangladesh', latitude: 23.8103, longitude: 90.4125 },
  ];

  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loading && !refreshing) {
      return;
    }
    // Set loading state
    if (!refreshing) {
      setLoading(true);
    }
    
    try {
      setError(null);

      // Quick path: load cached prayer times immediately so UI shows something
      try {
        const cachedPrayerTimesStart = await loadPrayerTimes();
        if (cachedPrayerTimesStart && cachedPrayerTimesStart.timings) {
          setPrayerTimes(cachedPrayerTimesStart.timings);
          if (cachedPrayerTimesStart.hijriDate) {
            setHijriDate(formatHijriDateWithArabic(cachedPrayerTimesStart.hijriDate));
          }
          if (cachedPrayerTimesStart.gregorianDate) {
            setGregorianDate(formatGregorianDate(cachedPrayerTimesStart.gregorianDate));
          }
          const nextCached = findNextPrayer(cachedPrayerTimesStart.timings);
          setNextPrayer(nextCached);
        }
      } catch (cacheErr) {
        console.warn('[PrayerTimes] failed to load cached prayer times early:', cacheErr);
      }

      // Determine location to use: auto-detect or manual selection, but DO NOT throw - fall back to saved or default
      let locationData = null;
      if (useAutoLocation) {
        try {
          locationData = await getLocationWithCity();
        } catch (locErr) {
          console.warn('[PrayerTimes] getLocationWithCity failed:', locErr);
          locationData = null;
        }
      }

      // If no location from auto, try manual selection or saved user location, else fallback to default city (Mecca)
      if (!locationData) {
        if (location && location.latitude && location.longitude) {
          locationData = location;
        } else {
          try {
            const { loadUserLocation } = await import('../utils/storageUtils');
            const saved = await loadUserLocation();
            if (saved && saved.latitude && saved.longitude) {
              locationData = saved;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      // Final fallback: use first predefined city (Mecca)
      if (!locationData) {
        console.warn('[PrayerTimes] no location available, falling back to default city (Mecca)');
        locationData = PREDEFINED_CITIES[0];
      }

      // Ensure coordinates are numbers using parseFloat for better type safety
      let lat = parseFloat(locationData.latitude);
      let lon = parseFloat(locationData.longitude);
      if (isNaN(lat) || isNaN(lon)) {
        console.warn('[PrayerTimes] invalid coords from locationData, falling back to default city coords');
        const fallback = PREDEFINED_CITIES[0];
        lat = fallback.latitude;
        lon = fallback.longitude;
      }
      const normalizedLocationData = {
        ...locationData,
        latitude: lat,
        longitude: lon,
      };
      setLocation(normalizedLocationData);

      // Fetch prayer times using the effective calculation method
      const effectiveMethodId = methodId ?? (await loadCalculationMethod()) ?? undefined;
      
  // Try to load cached data first to prevent flickering
  const cachedPrayerTimes = await loadPrayerTimes();
      if (cachedPrayerTimes && cachedPrayerTimes.timings) {
        // Set cached data immediately to prevent flickering
        setPrayerTimes(cachedPrayerTimes.timings);
        if (cachedPrayerTimes.hijriDate) {
          setHijriDate(formatHijriDateWithArabic(cachedPrayerTimes.hijriDate));
        }
        if (cachedPrayerTimes.gregorianDate) {
          setGregorianDate(formatGregorianDate(cachedPrayerTimes.gregorianDate));
        }
        if (cachedPrayerTimes.method) {
          setCalculationMethod(cachedPrayerTimes.method.name || 'ISNA');
          setMethodId(cachedPrayerTimes.method.id);
        }
        const next = findNextPrayer(cachedPrayerTimes.timings);
        setNextPrayer(next);
      }
      
      const prayerData = await fetchPrayerTimes(
        lat,
        lon,
        effectiveMethodId
      );

      if (!prayerData) {
        // Only throw error if we don't have cached data
        if (!cachedPrayerTimes || !cachedPrayerTimes.timings) {
          throw new Error('Unable to fetch prayer times. Please check your internet connection.');
        }
        // If we have cached data, just log a warning and continue
        console.warn('Failed to fetch fresh prayer times, using cached data');
        return;
      }

      setPrayerTimes(prayerData.timings);
      setHijriDate(formatHijriDateWithArabic(prayerData.hijriDate));
      setGregorianDate(formatGregorianDate(prayerData.gregorianDate));
      setCalculationMethod(prayerData.method.name);
      setMethodId(prayerData.method.id);

      // Find next prayer
      const next = findNextPrayer(prayerData.timings);
      setNextPrayer(next);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [methodId, useAutoLocation, location]);
  
  // Update ref whenever loadData changes
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleLocationPress = () => {
    setLocationPickerVisible(true);
  };

  const handleCitySelect = async (city) => {
    setLocation({
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      cityName: city.name,
    });
    // disable auto location when user picks a city
    setUseAutoLocation(false);
    setLocationPickerVisible(false);
    try {
      // Persist manual selection so other screens (web fallback) can use it
      await saveUserLocation({
        latitude: city.latitude,
        longitude: city.longitude,
        cityName: city.name,
        timestamp: Date.now(),
      });
      // Do NOT navigate away — refresh prayer times in-place so user stays on this screen
    } catch (e) {
      console.warn('Failed saving manual city:', e);
    }
    // Reload prayer times with new location
    setTimeout(() => {
      loadData();
    }, 300);
  };

  const handleMethodPress = () => {
    const methodList = methods.length ? methods : getCalculationMethods();
    setMethods(methodList);
    setMethodPickerVisible(true);
  };

  useEffect(() => {
    setMethods(getCalculationMethods());
    // Only load once on mount
    loadData();
  }, []); // Empty dependency array - only run once

  // Update next prayer every minute and check for date change
  useEffect(() => {
    if (!prayerTimes) return;

    let lastCheck = { 
      date: new Date().getDate(), 
      month: new Date().getMonth(), 
      year: new Date().getFullYear() 
    };

    const updateData = () => {
      const next = findNextPrayer(prayerTimes);
      setNextPrayer(next);

      // Check if date has changed
      const now = new Date();
      const currentDate = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // If date has changed, reload all data (but only if not already loading)
      if ((currentDate !== lastCheck.date ||
          currentMonth !== lastCheck.month ||
          currentYear !== lastCheck.year) && !loading) {
        lastCheck = { date: currentDate, month: currentMonth, year: currentYear };
        // Use ref to call loadData without adding it to dependencies
        if (loadDataRef.current) {
          loadDataRef.current();
        }
      }
    };

    // Run immediately and then every minute
    updateData();
    const interval = setInterval(updateData, 60000);

    return () => clearInterval(interval);
  }, [prayerTimes]); // Remove loadData from dependencies to prevent infinite loop

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Prayer Times" subtitle="Today's Schedule" />
        <LoadingSpinner message="Loading prayer times..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Prayer Times" subtitle="Today's Schedule" />
        <ErrorMessage message={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Prayer Times"
        subtitle="Today's Schedule"
        rightButton={
          <TouchableOpacity onPress={handleMethodPress}>
            <Ionicons name="settings-outline" size={24} color={colors.textWhite} />
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
        {/* Date and Location Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={styles.dateSection}>
            <Text style={[styles.hijriDate, { color: colors.text }]}>{hijriDate}</Text>
            <Text style={[styles.gregorianDate, { color: colors.textSecondary }]}>{gregorianDate}</Text>
          </View>

          <View style={styles.locationSection}>
            <TouchableOpacity onPress={handleLocationPress} style={[styles.locationButton, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.primaryDark }]}>
                {location && location.cityName && location.cityName !== 'Unknown Location'
                  ? location.cityName
                  : location && location.latitude && location.longitude
                    ? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`
                    : 'Loading...'
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleMethodPress} style={[styles.methodButton, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calculator-outline" size={16} color={colors.primary} />
              <Text style={[styles.methodText, { color: colors.primaryDark }]}>{calculationMethod}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayer Times List */}
        <View style={styles.prayerTimesContainer}>
          {PRAYER_ORDER.map((prayerName) => {
            const timeForPrayer = (prayerTimes || {})[prayerName];
            if (!timeForPrayer) return null;

            return (
              <PrayerCard
                key={prayerName}
                prayerName={prayerName}
                time={timeForPrayer}
                isNext={nextPrayer?.name === prayerName}
                showArabic={true}
              />
            );
          })}
        </View>

        {/* Additional Info */}
        <View style={[styles.additionalInfo, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Prayer Times Information</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Prayer times are calculated based on your location and the selected calculation method.
            Times may vary slightly depending on local conditions and mosque preferences.
          </Text>
        </View>
      </ScrollView>
      {/* Calculation Method Picker Modal */}
      <Modal
        visible={methodPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMethodPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, width: '90%' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Select Calculation Method</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {methods.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={{ paddingVertical: 12, paddingHorizontal: 8, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={async () => {
                    setMethodId(m.id);
                    await saveCalculationMethod(m.id);
                    setMethodPickerVisible(false);
                    await loadData();
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 14, flex: 1, paddingRight: 8 }}>{m.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>ID {m.id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setMethodPickerVisible(false)}
              style={{ marginTop: 12, alignSelf: 'flex-end', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: colors.textWhite, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Location Picker Modal */}
      <Modal
        visible={locationPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: colors.cardBackground, borderRadius: 12, padding: 20, width: '100%', maxHeight: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Location Settings</Text>

            {/* Auto Location Toggle */}
            <View style={{ marginBottom: 20, paddingBottom: 16, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>Auto Detect Location</Text>
                <TouchableOpacity
                  onPress={() => {
                    const newVal = !useAutoLocation;
                    setUseAutoLocation(newVal);
                    // If re-enabling auto location, reload using device GPS
                    if (newVal) {
                      setTimeout(() => loadData(), 200);
                    }
                  }}
                  style={{
                    width: 50,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: useAutoLocation ? colors.primary : colors.border,
                    justifyContent: 'center',
                    alignItems: useAutoLocation ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 3
                  }}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.textWhite }} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {useAutoLocation ? 'Using device GPS to detect your location' : 'Select from predefined cities below'}
              </Text>
            </View>

            {/* City List */}
            {!useAutoLocation && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12, fontWeight: '500' }}>Select City:</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {PREDEFINED_CITIES.map((city, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleCitySelect(city)}
                      style={{ paddingVertical: 12, paddingHorizontal: 12, borderBottomColor: colors.border, borderBottomWidth: 1 }}
                    >
                      <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }}>{city.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Current Location Display */}
            <View style={{ marginBottom: 20, paddingBottom: 16, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' }}>Current Location</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600', marginBottom: 4 }}>
                {location && location.cityName && location.cityName !== 'Unknown Location'
                  ? location.cityName
                  : location
                    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                    : 'Loading...'
                }
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'N/A'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setLocationPickerVisible(false)}
              style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textWhite, fontWeight: '600', fontSize: 16 }}>Close</Text>
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
  infoContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hijriDate: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: 16,
  },
  locationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  methodText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  prayerTimesContainer: {
    marginTop: 8,
  },
  additionalInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PrayerTimesScreen;
