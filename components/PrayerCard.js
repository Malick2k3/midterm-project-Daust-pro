import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { PRAYER_NAMES } from '../constants/prayerNames';
import { formatTime12Hour } from '../utils/timeUtils';

const PrayerCard = ({ prayerName, time, isNext = false, showArabic = true }) => {
  const prayerInfo = PRAYER_NAMES[prayerName];
  if (!prayerInfo) return null;

  return (
    <View style={[
      styles.container,
      isNext && styles.nextPrayerContainer
    ]}>
      <View style={styles.content}>
        <View style={styles.prayerInfo}>
          <Text style={[
            styles.prayerName,
            isNext && styles.nextPrayerName
          ]}>
            {prayerInfo.en}
          </Text>
          {showArabic && (
            <Text style={[
              styles.arabicName,
              isNext && styles.nextArabicName
            ]}>
              {prayerInfo.ar}
            </Text>
          )}
        </View>
        <View style={styles.timeContainer}>
          <Text style={[
            styles.time,
            isNext && styles.nextPrayerTime
          ]}>
            {formatTime12Hour(time)}
          </Text>
          <Text style={[
            styles.timeDescription,
            isNext && styles.nextTimeDescription
          ]}>
            {prayerInfo.time}
          </Text>
        </View>
      </View>
      {isNext && (
        <View style={styles.nextIndicator}>
          <Text style={styles.nextText}>NEXT</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextPrayerContainer: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  nextPrayerName: {
    color: Colors.primaryDark,
    fontSize: 20,
  },
  arabicName: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  nextArabicName: {
    color: Colors.primaryDark,
    fontSize: 18,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  nextPrayerTime: {
    color: Colors.primaryDark,
    fontSize: 20,
  },
  timeDescription: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextTimeDescription: {
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  nextIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default PrayerCard;
