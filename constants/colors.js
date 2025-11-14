export const lightTheme = {
  // Primary colors
  primary: '#10b981',          // Main green
  primaryDark: '#059669',      // Darker green
  primaryLight: '#d1fae5',     // Light green

  // Background colors
  background: '#f9fafb',       // Light gray
  cardBackground: '#ffffff',   // White
  surface: '#ffffff',          // White surface

  // Text colors
  text: '#111827',             // Almost black
  textSecondary: '#6b7280',    // Medium gray
  textLight: '#9ca3af',        // Light gray
  textWhite: '#ffffff',         // White text

  // Border and divider colors
  border: '#e5e7eb',           // Border gray
  divider: '#f3f4f6',          // Divider gray

  // Status colors
  error: '#ef4444',            // Red
  success: '#10b981',          // Green
  warning: '#f59e0b',          // Orange
  info: '#3b82f6',             // Blue

  // Shadow colors
  shadow: '#000000',           // Black for shadows
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',

  // Prayer-specific colors
  fajr: '#1e40af',             // Blue for Fajr
  sunrise: '#f59e0b',          // Orange for Sunrise
  dhuhr: '#10b981',            // Green for Dhuhr
  asr: '#f97316',              // Orange for Asr
  maghrib: '#dc2626',          // Red for Maghrib
  isha: '#7c3aed',             // Purple for Isha

  // Compass colors
  compassBackground: '#f8fafc',
  compassBorder: '#e2e8f0',
  compassNeedle: '#dc2626',    // Red needle
  compassText: '#475569',

  // Tasbih colors
  tasbihBackground: '#f0f9ff',
  tasbihButton: '#3b82f6',
  tasbihCounter: '#1e40af',
};

export const darkTheme = {
  // Primary colors
  primary: '#34d399',          // Lighter green for dark theme
  primaryDark: '#10b981',      // Main green as dark
  primaryLight: '#064e3b',     // Dark green

  // Background colors
  background: '#111827',       // Dark gray
  cardBackground: '#1f2937',   // Dark card
  surface: '#374151',          // Dark surface

  // Text colors
  text: '#f9fafb',             // Light text
  textSecondary: '#d1d5db',    // Light gray
  textLight: '#9ca3af',        // Medium gray
  textWhite: '#ffffff',         // White text

  // Border and divider colors
  border: '#374151',           // Dark border
  divider: '#4b5563',          // Dark divider

  // Status colors
  error: '#f87171',            // Light red
  success: '#34d399',          // Light green
  warning: '#fbbf24',          // Light orange
  info: '#60a5fa',             // Light blue

  // Shadow colors
  shadow: '#000000',           // Black for shadows
  shadowLight: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.5)',
  shadowDark: 'rgba(0, 0, 0, 0.7)',

  // Prayer-specific colors (slightly lighter for dark theme)
  fajr: '#3b82f6',             // Light blue for Fajr
  sunrise: '#fbbf24',          // Light orange for Sunrise
  dhuhr: '#34d399',            // Light green for Dhuhr
  asr: '#fb923c',              // Light orange for Asr
  maghrib: '#f87171',          // Light red for Maghrib
  isha: '#a78bfa',             // Light purple for Isha

  // Compass colors
  compassBackground: '#1f2937',
  compassBorder: '#374151',
  compassNeedle: '#f87171',    // Light red needle
  compassText: '#d1d5db',

  // Tasbih colors
  tasbihBackground: '#1e293b',
  tasbihButton: '#60a5fa',
  tasbihCounter: '#3b82f6',
};

// Default export for backward compatibility
export const Colors = lightTheme;
