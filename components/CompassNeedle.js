import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const CompassNeedle = ({ rotation = 0, size = 200 }) => {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        transform: [{ rotate: `${rotation}deg` }],
      }
    ]}>
      {/* Needle */}
      <View style={[styles.needle, { backgroundColor: colors.compassNeedle, shadowColor: colors.shadow }]} />

      {/* Center dot */}
      <View style={[styles.centerDot, { backgroundColor: colors.compassNeedle, shadowColor: colors.shadow }]} />

      {/* Needle tip */}
      <View style={[styles.needleTip, { borderBottomColor: colors.compassNeedle }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  needle: {
    position: 'absolute',
    width: 4,
    height: '70%',
    borderRadius: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    zIndex: 2,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  needleTip: {
    position: 'absolute',
    top: '15%',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
  },
});

export default CompassNeedle;
