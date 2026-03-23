# Daust Pro

Daust Pro is a React Native and Expo mobile app built around a few daily Islamic utilities in one place: prayer times, Qibla direction, Tasbih, Quran browsing, and the Islamic calendar.

The app is designed to stay useful even when the network is unreliable. Prayer times are loaded with a cached-first flow, manual city selection is supported when location access is not available, and the Qibla feature falls back safely when device sensors are limited.

## Features

- Prayer times with cached-first loading and Aladhan API refresh
- Qibla compass using the device magnetometer when available
- Tasbih counter for daily dhikr
- Islamic calendar with Hijri date formatting
- Quran browsing with remote fetch and local fallback data
- Manual city selection with persisted location preferences
- Local prayer reminder scheduling through Expo Notifications

## Stack

- React Native
- Expo
- React Navigation
- AsyncStorage
- Expo Location
- Expo Sensors
- Expo Notifications
- Aladhan API
- Quran API

## Project structure

- `components/` shared UI building blocks
- `screens/` main app screens
- `services/` API, sensor, location, and notification integrations
- `constants/` configuration and fallback data
- `utils/` storage, validation, and formatting helpers
- `contexts/` app-wide theme state

## Run locally

```bash
npm install
npx expo start --clear
```

Then open the app in one of these ways:

- Android emulator: `npm run android`
- iOS simulator: `npm run ios`
- Web preview: `npm run web`
- Physical device: scan the Expo QR code in Expo Go

## Notes for reviewers

- Full notification behavior is best tested in a development build. Expo Go has limits around native notification flows.
- The Qibla compass works best on physical devices with a magnetometer.
- Cached prayer times are used as a fallback when a fresh API request fails or is slow.

## Main screens

- Home
- Prayer Times
- Qibla
- Tasbih
- Quran
- Calendar
- Settings
