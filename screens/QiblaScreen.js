import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import CompassNeedle from '../components/CompassNeedle';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { getCurrentLocation } from '../services/locationService';
import { startMagnetometer, stopMagnetometer, calibrateCompass } from '../services/magnetometerService';
import { calculateQiblaDirection, getDistanceToMecca, getQiblaCompassDirection } from '../utils/qiblaCalculation';
import { useTheme } from '../contexts/ThemeContext';

const QiblaScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [compassDirection, setCompassDirection] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [magnetometerSubscription, setMagnetometerSubscription] = useState(null);
  const [magnetometerAvailable, setMagnetometerAvailable] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Get location
      const locationData = await getCurrentLocation();
      if (!locationData) {
        throw new Error('Unable to get your location. Please check location permissions.');
      }
      
      // Normalize numeric types to prevent strings reaching native modules
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

      // Calculate Qibla direction
      const bearing = calculateQiblaDirection(lat, lon);
      setQiblaBearing(bearing);

      // Calculate distance to Mecca
      const dist = getDistanceToMecca(lat, lon);
      setDistance(dist);

      // Try to start magnetometer; if unavailable (web or permissions), fall back to static display
      try {
        const subscription = await startMagnetometer((data) => {
          setDeviceHeading(data.heading);
          setIsCalibrated(data.isCalibrated);

          // Calculate compass direction (relative to device heading)
          const compassDir = getQiblaCompassDirection(bearing, data.heading);
          setCompassDirection(compassDir);
        });

        setMagnetometerSubscription(subscription);
        setMagnetometerAvailable(true);
      } catch (magErr) {
        // Magnetometer not available on this device (common on web)
        console.warn('Magnetometer unavailable, falling back to static Qibla display:', magErr);
        setMagnetometerAvailable(false);
        setDeviceHeading(0);
        // Set compass to show absolute Qibla bearing (relative to North)
        setCompassDirection(bearing);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      // Only show error if we truly can't function without it
      // For Qibla, location is critical, so show error
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCalibrate = async () => {
    try {
      Alert.alert(
        'Calibrate Compass',
        'Hold your device flat and move it in a figure-8 pattern for about 30 seconds.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Calibration', 
            onPress: async () => {
              const success = await calibrateCompass();
              if (success) {
                Alert.alert('Success', 'Compass calibrated successfully!');
              } else {
                Alert.alert('Error', 'Calibration failed. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Calibration error:', error);
    }
  };

  useEffect(() => {
    loadData();

    return () => {
      if (magnetometerSubscription) {
        stopMagnetometer(magnetometerSubscription);
      }
    };
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Qibla Compass" subtitle="Find Prayer Direction" />
        <LoadingSpinner message="Initializing compass..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Qibla Compass" subtitle="Find Prayer Direction" />
        <ErrorMessage message={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Qibla Compass"
        subtitle="Find Prayer Direction"
        rightButton={
          <TouchableOpacity onPress={handleCalibrate}>
            <Ionicons name="refresh-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!magnetometerAvailable && (
          <View style={{ width: '100%', paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ color: colors.warning, textAlign: 'center' }}>
              Magnetometer not available on this device — showing static Qibla direction.
            </Text>
          </View>
        )}
        {/* Compass */}
        <View style={styles.compassContainer}>
          <View style={[styles.compass, { backgroundColor: colors.compassBackground, borderColor: colors.compassBorder }]}>
            {/* Cardinal directions */}
            <Text style={[styles.cardinal, styles.north, { color: colors.compassText }]}>N</Text>
            <Text style={[styles.cardinal, styles.east, { color: colors.compassText }]}>E</Text>
            <Text style={[styles.cardinal, styles.south, { color: colors.compassText }]}>S</Text>
            <Text style={[styles.cardinal, styles.west, { color: colors.compassText }]}>W</Text>

            {/* Compass needle */}
            <CompassNeedle rotation={compassDirection} size={200} />
          </View>
        </View>

        {/* Qibla Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Qibla Direction:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{Math.round(qiblaBearing)}°</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Distance to Mecca:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{distance.toLocaleString()} km</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Compass Status:</Text>
            <Text style={[styles.infoValue, { color: isCalibrated ? colors.success : colors.warning }]}>
              {isCalibrated ? 'Calibrated' : 'Needs Calibration'}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to Use:</Text>
          <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
            1. Hold your device flat{'\n'}
            2. Point the red needle toward Mecca{'\n'}
            3. Face the direction the needle points{'\n'}
            4. Calibrate if readings seem inaccurate
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
  content: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: '100%',
  },
  compassContainer: {
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  compass: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardinal: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
  },
  north: {
    top: 10,
  },
  east: {
    right: 10,
  },
  south: {
    bottom: 10,
  },
  west: {
    left: 10,
  },
  infoContainer: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginVertical: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default QiblaScreen;
