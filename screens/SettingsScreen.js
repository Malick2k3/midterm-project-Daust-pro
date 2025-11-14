import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { loadNotificationsEnabled, saveNotificationsEnabled } from '../utils/storageUtils';
import { requestNotificationPermission, areNotificationsEnabled } from '../services/notificationService';
import { Colors } from '../constants/colors';
import Header from '../components/Header';

const SettingsScreen = ({ navigation }) => {
  const { theme, colors, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedNotifications = await loadNotificationsEnabled();

        if (savedNotifications !== null) {
          setNotificationsEnabled(savedNotifications);
        } else {
          // Check actual notification permission
          const hasPermission = await areNotificationsEnabled();
          setNotificationsEnabled(hasPermission);
        }

        // calculation method removed from settings - handled in Prayer Times screen
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleNotificationToggle = async (value) => {
    try {
      if (value) {
        const hasPermission = await requestNotificationPermission();
        setNotificationsEnabled(hasPermission);
        await saveNotificationsEnabled(hasPermission);
      } else {
        setNotificationsEnabled(false);
        await saveNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  // Calculation method removed from settings UI per request

  const SettingItem = ({ title, subtitle, rightElement, onPress }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

          <SettingItem
            title="Theme"
            subtitle={`Current: ${theme === 'light' ? 'Light' : 'Dark'}`}
            rightElement={
              <TouchableOpacity
                style={[styles.themeToggle, { backgroundColor: colors.surface }]}
                onPress={toggleTheme}
              >
                <Ionicons
                  name={theme === 'light' ? 'moon' : 'sunny'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.themeText, { color: colors.text }]}>
                  {theme === 'light' ? 'Dark' : 'Light'}
                </Text>
              </TouchableOpacity>
            }
            onPress={toggleTheme}
          />
        </View>

          {/* Prayer Times Section removed from Settings per user request */}

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>

          <SettingItem
            title="Prayer Time Notifications"
            subtitle="Get notified before each prayer time"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notificationsEnabled ? colors.textWhite : colors.textLight}
              />
            }
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>

          <SettingItem
            title="Version"
            subtitle="1.0.0"
          />

          <SettingItem
            title="Developer"
            subtitle="Cheikh El Hadji Malick Niang mou sell mii"
          />
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
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default SettingsScreen;
