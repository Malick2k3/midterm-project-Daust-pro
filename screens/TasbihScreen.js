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
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { saveTasbihCount, loadTasbihCount } from '../utils/storageUtils';
import { triggerHaptic } from '../services/notificationService';
import { APP_CONFIG } from '../constants/config';
import { COMMON_DHIKR } from '../constants/prayerNames';
import { useTheme } from '../contexts/ThemeContext';

const TasbihScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [progress, setProgress] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Load saved count
      const savedCount = await loadTasbihCount();
      setCount(savedCount || 0);
      
      // Calculate progress
      const progressPercent = ((savedCount || 0) / target) * 100;
      setProgress(Math.min(progressPercent, 100));

    } catch (err) {
      console.error('Error loading data:', err);
      // For Tasbih, if loading fails, just start with 0 count
      // Only show error if it's a critical failure
      if (err.message && !err.message.includes('storage')) {
        setError(err.message);
      } else {
        // Storage errors are not critical - just start fresh
        setCount(0);
        setProgress(0);
      }
    } finally {
      setLoading(false);
    }
  }, [target]);

  const incrementCount = async () => {
    try {
      const newCount = count + 1;
      setCount(newCount);
      
      // Save to storage
      await saveTasbihCount(newCount);
      
      // Calculate progress
      const progressPercent = (newCount / target) * 100;
      setProgress(Math.min(progressPercent, 100));
      
      // Trigger haptic feedback
      await triggerHaptic('light');
      
      // Check for milestones
      if (APP_CONFIG.TASBIH_TARGETS.includes(newCount)) {
        await triggerHaptic('success');
        Alert.alert(
          'Milestone Reached!',
          `You've reached ${newCount} dhikr. Masha Allah!`,
          [{ text: 'Continue' }]
        );
      }
      
    } catch (error) {
      console.error('Error incrementing count:', error);
    }
  };

  const resetCount = () => {
    Alert.alert(
      'Reset Counter',
      'Are you sure you want to reset the counter?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            setCount(0);
            setProgress(0);
            await saveTasbihCount(0);
            await triggerHaptic('medium');
          }
        }
      ]
    );
  };

  const setTargetCount = (newTarget) => {
    setTarget(newTarget);
    const progressPercent = (count / newTarget) * 100;
    setProgress(Math.min(progressPercent, 100));
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Tasbih Counter" subtitle="Digital Dhikr Counter" />
        <LoadingSpinner message="Loading counter..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Tasbih Counter" subtitle="Digital Dhikr Counter" />
        <ErrorMessage message={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Tasbih Counter"
        subtitle="Digital Dhikr Counter"
        rightButton={
          <TouchableOpacity onPress={resetCount}>
            <Ionicons name="refresh-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Counter Display */}
        <View style={[styles.counterContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.countText, { color: colors.tasbihCounter }]}>{count}</Text>
          <Text style={[styles.targetText, { color: colors.textSecondary }]}>Target: {target}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: colors.primary }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.round(progress)}%</Text>
          </View>
        </View>

        {/* Tap Button */}
        <TouchableOpacity
          style={[styles.tapButton, { backgroundColor: colors.tasbihButton, shadowColor: colors.shadow }]}
          onPress={incrementCount}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={48} color={colors.textWhite} />
        </TouchableOpacity>

        {/* Target Buttons */}
        <View style={styles.targetButtonsContainer}>
          <Text style={[styles.targetTitle, { color: colors.text }]}>Quick Targets:</Text>
          <View style={styles.targetButtons}>
            {APP_CONFIG.TASBIH_TARGETS.map((targetValue) => (
              <TouchableOpacity
                key={targetValue}
                style={[
                  styles.targetButton,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  target === targetValue && [styles.targetButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                ]}
                onPress={() => setTargetCount(targetValue)}
              >
                <Text style={[
                  styles.targetButtonText,
                  { color: colors.text },
                  target === targetValue && [styles.targetButtonTextActive, { color: colors.textWhite }]
                ]}>
                  {targetValue}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dhikr Suggestions */}
        <View style={[styles.dhikrContainer, { backgroundColor: colors.tasbihBackground }]}>
          <Text style={[styles.dhikrTitle, { color: colors.text }]}>Common Dhikr:</Text>
          {COMMON_DHIKR.map((dhikr, index) => (
            <Text key={index} style={[styles.dhikrText, { color: colors.textSecondary }]}>{dhikr}</Text>
          ))}
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
  },
  counterContainer: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  countText: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  targetText: {
    fontSize: 18,
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tapButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  targetButtonsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  targetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  targetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  targetButtonActive: {
  },
  targetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  targetButtonTextActive: {
  },
  dhikrContainer: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  dhikrTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dhikrText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default TasbihScreen;
