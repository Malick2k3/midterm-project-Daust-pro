import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ErrorMessage = ({
  message = 'Something went wrong',
  onRetry = null,
  showRetry = true
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Oops!</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

      {showRetry && onRetry && (
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
          <Ionicons name="refresh" size={20} color={colors.textWhite} />
          <Text style={[styles.retryText, { color: colors.textWhite }]}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ErrorMessage;
