import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/colors';

const Header = ({
  title,
  subtitle = null,
  rightButton = null,
  showGradient = true,
  textColor = null,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const HeaderContent = () => (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, textColor ? { color: textColor } : (showGradient ? null : { color: colors.text })]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, textColor ? { color: textColor } : (showGradient ? null : { color: colors.textSecondary })]}>{subtitle}</Text>
          )}
        </View>
        {rightButton && (
          <View style={styles.rightButtonContainer}>
            {rightButton}
          </View>
        )}
      </View>
    </View>
  );

  if (showGradient) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.gradientContainer, { paddingTop: insets.top + 20 }]}
      >
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.solidContainer, { paddingTop: insets.top + 20, backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
      <HeaderContent />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    paddingBottom: 20,
  },
  solidContainer: {
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  container: {
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textWhite,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textWhite,
    opacity: 0.9,
  },
  rightButtonContainer: {
    marginLeft: 16,
  },
});

export default Header;
