import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { PRAYER_NAMES } from '../constants/prayerNames';

const NextPrayerCard = ({ prayerName, time, countdown }) => {
  const prayerInfo = PRAYER_NAMES[prayerName];
  if (!prayerInfo) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nextText}>Next Prayer</Text>
        <Text style={styles.countdown}>{countdown}</Text>
      </View>
      
      <View style={styles.prayerInfo}>
        <Text style={styles.prayerName}>{prayerInfo.en}</Text>
        <Text style={styles.arabicName}>{prayerInfo.ar}</Text>
        <Text style={styles.timeDescription}>{prayerInfo.time}</Text>
      </View>
      
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{time}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Time until prayer</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    margin: 16,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  countdown: {
    color: Colors.textWhite,
    fontSize: 24,
    fontWeight: 'bold',
  },
  prayerInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  prayerName: {
    color: Colors.textWhite,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  arabicName: {
    color: Colors.textWhite,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeDescription: {
    color: Colors.textWhite,
    fontSize: 14,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  time: {
    color: Colors.textWhite,
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textWhite,
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default NextPrayerCard;
