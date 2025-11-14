import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { getLocationWithCity } from '../services/locationService';
import { loadUserLocation, loadPrayerTimes } from '../utils/storageUtils';
import { fetchPrayerTimes } from '../services/prayerTimesApi';
import { formatHijriDateWithArabic, formatGregorianDate, getRelativeDate, getCurrentHijriDate, getIslamicMonth } from '../utils/dateUtils';
import { IMPORTANT_DATES } from '../constants/islamicDates';
import { useTheme } from '../contexts/ThemeContext';
import * as hijriConverter from 'hijri-converter';

const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [upcomingDates, setUpcomingDates] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Get location (try cached location if current fails)
      let locationData = await getLocationWithCity();
      if (!locationData) {
        // Try to get cached location
        const cachedLocation = await loadUserLocation();
        if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
          locationData = cachedLocation;
        } else {
          throw new Error('Unable to get your location. Please check location permissions.');
        }
      }
      
      // Ensure coordinates are numbers
      const lat = parseFloat(locationData.latitude);
      const lon = parseFloat(locationData.longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid location coordinates');
      }
      
      const normalizedLocation = {
        ...locationData,
        latitude: lat,
        longitude: lon,
      };
      setLocation(normalizedLocation);

      // Fetch prayer times to get current Hijri date
      const prayerData = await fetchPrayerTimes(
        lat, 
        lon
      );
      
      if (!prayerData) {
        // Try to use cached prayer times for date info
        const cachedPrayerTimes = await loadPrayerTimes();
        if (cachedPrayerTimes && cachedPrayerTimes.hijriDate) {
          // Use cached data for dates
          setHijriDate(formatHijriDateWithArabic(cachedPrayerTimes.hijriDate));
          const gregorianDateData = cachedPrayerTimes.gregorianDate?.date 
            ? { date: cachedPrayerTimes.gregorianDate.date } 
            : cachedPrayerTimes.gregorianDate;
          setGregorianDate(formatGregorianDate(gregorianDateData));
        } else {
          throw new Error('Unable to fetch calendar data. Please check your internet connection.');
        }
      } else {
        // We have prayer data, use it
        setHijriDate(formatHijriDateWithArabic(prayerData.hijriDate));
        // Handle both API response format and cached format
        const gregorianDateData = prayerData.gregorianDate?.date 
          ? { date: prayerData.gregorianDate.date } 
          : prayerData.gregorianDate;
        setGregorianDate(formatGregorianDate(gregorianDateData));
      }

      // Calculate upcoming important dates
      const now = new Date();
      const currentIslamicDate = getCurrentHijriDate();

      const upcoming = IMPORTANT_DATES.map(date => {
        // Determine which Islamic year to use for this event
        let eventHijriYear = currentIslamicDate.year;
        
        // If we're past this month in the current year, use next year
        if (date.month < currentIslamicDate.month || 
            (date.month === currentIslamicDate.month && date.day < currentIslamicDate.day)) {
          eventHijriYear++;
        }

        // For Muharram (month 1), always use next year if we're near the end of current year
        if (date.month === 1 && currentIslamicDate.month > 10) {
          eventHijriYear++;
        }

        // Convert Islamic date to Gregorian using hijri-converter library for accuracy
        let gregorianDate;
        try {
          const gregorian = hijriConverter.toGregorian(
            eventHijriYear,
            date.month,
            date.day
          );
          gregorianDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
          
          // If the date has already passed this year, calculate for next year
          if (gregorianDate < now) {
            const nextYearGregorian = hijriConverter.toGregorian(
              eventHijriYear + 1,
              date.month,
              date.day
            );
            gregorianDate = new Date(nextYearGregorian.gy, nextYearGregorian.gm - 1, nextYearGregorian.gd);
            eventHijriYear++; // Update year for display
          }
        } catch (error) {
          console.error('Error converting Hijri date:', error);
          // Fallback: estimate based on current date
          // Islamic year is about 354 days, so approximately 11 days shorter per year
          const daysDiff = (eventHijriYear - currentIslamicDate.year) * 354;
          gregorianDate = new Date(now);
          gregorianDate.setDate(gregorianDate.getDate() + daysDiff);
        }
        
        const hijriMonthName = getIslamicMonth(date.month).en;
        return {
          ...date,
          hijriDate: `${date.day} ${hijriMonthName} ${eventHijriYear}`,
          gregorianDate: gregorianDate,
          relativeDate: getRelativeDate(gregorianDate),
        };
      }).sort((a, b) => a.gregorianDate - b.gregorianDate);

      setUpcomingDates(upcoming);

    } catch (err) {
      console.error('Error loading data:', err);
      // Try to use cached data before showing error
      try {
        const cachedPrayerTimes = await loadPrayerTimes();
        if (cachedPrayerTimes && cachedPrayerTimes.hijriDate) {
          setHijriDate(formatHijriDateWithArabic(cachedPrayerTimes.hijriDate));
          const gregorianDateData = cachedPrayerTimes.gregorianDate?.date 
            ? { date: cachedPrayerTimes.gregorianDate.date } 
            : cachedPrayerTimes.gregorianDate;
          setGregorianDate(formatGregorianDate(gregorianDateData));
          // Calculate dates even with cached data
          const now = new Date();
          const currentIslamicDate = getCurrentHijriDate();
          const upcoming = IMPORTANT_DATES.map(date => {
            let eventHijriYear = currentIslamicDate.year;
            if (date.month < currentIslamicDate.month || 
                (date.month === currentIslamicDate.month && date.day < currentIslamicDate.day)) {
              eventHijriYear++;
            }
            if (date.month === 1 && currentIslamicDate.month > 10) {
              eventHijriYear++;
            }
            try {
              const gregorian = hijriConverter.toGregorian(eventHijriYear, date.month, date.day);
              const gregorianDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
              if (gregorianDate < now) {
                const nextYearGregorian = hijriConverter.toGregorian(eventHijriYear + 1, date.month, date.day);
                const nextDate = new Date(nextYearGregorian.gy, nextYearGregorian.gm - 1, nextYearGregorian.gd);
                const hijriMonthName = getIslamicMonth(date.month).en;
                return {
                  ...date,
                  hijriDate: `${date.day} ${hijriMonthName} ${eventHijriYear + 1}`,
                  gregorianDate: nextDate,
                  relativeDate: getRelativeDate(nextDate),
                };
              }
              const hijriMonthName = getIslamicMonth(date.month).en;
              return {
                ...date,
                hijriDate: `${date.day} ${hijriMonthName} ${eventHijriYear}`,
                gregorianDate: gregorianDate,
                relativeDate: getRelativeDate(gregorianDate),
              };
            } catch (convError) {
              return null;
            }
          }).filter(Boolean).sort((a, b) => a.gregorianDate - b.gregorianDate);
          setUpcomingDates(upcoming);
          // Don't show error if we have cached data
          return;
        }
      } catch (cacheError) {
        // If even cached data fails, show the original error
      }
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Islamic Calendar" subtitle="Important Dates" />
        <LoadingSpinner message="Loading calendar..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Islamic Calendar" subtitle="Important Dates" />
        <ErrorMessage message={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Islamic Calendar" subtitle="Important Dates" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Date Display */}
        <View style={[styles.currentDateContainer, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
          <Text style={[styles.currentDateTitle, { color: colors.textWhite }]}>Today</Text>
          <Text style={[styles.hijriDate, { color: colors.textWhite }]}>{hijriDate}</Text>
          <Text style={[styles.gregorianDate, { color: colors.textWhite }]}>{gregorianDate}</Text>
        </View>

        {/* Upcoming Important Dates */}
        <View style={styles.datesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Important Dates</Text>

          {upcomingDates.map((date, index) => (
            <View key={index} style={[styles.dateCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <View style={styles.dateInfo}>
                <Text style={[styles.dateName, { color: colors.text }]}>{date.name}</Text>
                <Text style={[styles.dateArabic, { color: colors.primary }]}>{date.ar}</Text>
                <Text style={[styles.dateDescription, { color: colors.textSecondary }]}>{date.description}</Text>
              </View>

              <View style={styles.dateDetails}>
                <Text style={[styles.dateRelative, { color: colors.primary }]}>{date.relativeDate}</Text>
                <Text style={[styles.dateHijri, { color: colors.textLight }]}>{date.hijriDate}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Calendar Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About the Islamic Calendar</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            The Islamic calendar is a lunar calendar consisting of 12 months.
            Each month begins with the sighting of the new moon. Important dates
            may vary by a day or two depending on moon sighting in different regions.
          </Text>
        </View>
      </ScrollView>
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
  currentDateContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  currentDateTitle: {
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hijriDate: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  gregorianDate: {
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  datesContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dateCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateInfo: {
    flex: 1,
  },
  dateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateArabic: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  dateDetails: {
    alignItems: 'flex-end',
  },
  dateRelative: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateHijri: {
    fontSize: 12,
  },
  infoContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default CalendarScreen;
