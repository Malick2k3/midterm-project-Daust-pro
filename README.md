## Daust Pro - Prayer Times & Qibla App

This repository contains the source code for Daust Pro, a React Native + Expo app that provides prayer times, a Qibla compass, a Tasbih counter, and an Islamic calendar.

## About

Daust Pro is a mobile-first Islamic utility app. Key features implemented in this branch:

- Accurate prayer times with a cached-first UX (uses Aladhan API as a fallback)
- Qibla compass using device magnetometer (with fallbacks for web)
- Tasbih (digital dhikr) counter
- Islamic calendar with Hijri date formatting
- Local notification scheduling for prayer reminders (some notification features require a dev build)
- Manual city selection with persisted user location and an auto-location toggle

App display name: Daust pro
Developer: Cheikh El Hadji Malick Niang mou sell mii

## Quick start (development)

1. Install dependencies:

```powershell
npm install
```

2. Start the Expo development server (clear cache recommended):

```powershell
npx expo start --clear
```

3. Open the app on device/emulator

- On a physical device: use the Expo Go app and scan the QR code shown by Metro.
- On Android emulator: `npm run android` (requires Android Studio/emulator setup).
- On iOS Simulator (macOS only): `npm run ios`.
- Web: `npm run web`.

## Notes and caveats

- Expo Go has limitations for push/notifications. To test full notification flows (especially on Android) you need a development build or standalone app. See: https://expo.dev/development-builds
- The app uses a cached-first approach for prayer times: when the API is slow the app will show cached times immediately and then update when fresh data arrives.

## File structure (high level)

- `components/` — reusable UI components
- `screens/` — application screens (PrayerTimes, Home, Qibla, Tasbih, Calendar, Settings)
- `services/` — integrations (location, magnetometer, notifications, prayerTimes API)
- `utils/` — helpers (date/time formatting, persistent storage)

## Local verification checklist

1. Run `npm install`.
2. Start Metro: `npx expo start --clear`.
3. Open the app on your device/emulator. Verify:
   - The Prayer Times screen shows cached timings quickly and refreshes when online.
   - The Qibla compass rotates with device orientation (on physical devices).
   - Notifications are scheduled (check console logs) — for full functionality use a dev build.

## License

This project is private.



