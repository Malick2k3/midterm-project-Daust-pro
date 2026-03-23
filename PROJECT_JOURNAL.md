# Project Journal — Daust Pro

**Title:** Daust Pro — mobile prayer times, Qibla, Tasbih, and Islamic calendar

## Overview

I built Daust Pro, a React Native app using Expo that provides prayer times, a Qibla compass, a Tasbih counter, and an Islamic calendar.the app is built with  Expo Go and react native , and user-friendly with features like manual city selection and persisted settings.


## Key features

- Prayer times (cached-first UX with Aladhan API fallback)
- Qibla compass using device magnetometer (with web fallbacks)
- Tasbih (digital dhikr) counter
- Islamic Calendar with Hijri formatting
- Local notifications for prayer times 
- Manual city selection + persisted user location
- Live time in header, scrollable screens, polished UI

## Architecture & tech

- React Native (Expo-managed), JavaScript
- Key libs: expo-location, expo-notifications, expo-sensors, @react-native-async-storage/async-storage, hijri-converter, Aladhan API
- Structure:
  - `screens/` — UI views (PrayerTimes, Home, Qibla, Tasbih, Calendar, Settings)
  
  - `components/` — reusable UI parts
  - `services/` — locationService, magnetometerService, notificationService, prayerTimesApi
  - `utils/` — date/time helpers, storage helpers

## Major problems I encountered and how I solved them

### 1) Startup ReferenceError (theme colors accessed at module evaluation)
- Problem: Some components referenced theme `colors` at module scope (in `StyleSheet.create`) which ran before `ThemeProvider` was ready, causing ReferenceErrors on app start.
- Fix: Moved theme-dependent styles into the component render or replaced module-scope `colors` uses with a static `Colors` constant. Ensured `useTheme()` is only called during render.

### 2) Hijri conversion error (toHijri TypeError)
- Problem: The `hijri-converter` usage threw errors when date inputs were malformed.
- Fix: Normalized input date shapes in `utils/dateUtils.js` and added defensive guards so we never call `toHijri` with null/undefined.

### 3) PrayerTimes render-time TypeError (null mapping)
- Problem: Opening the Prayer Times screen sometimes crashed with "Cannot convert null value to object" while mapping over prayer times when data was not yet available.
- Fix: Initialized `prayerTimes` to an empty object, added guarded rendering checks, and implemented a cached-first pattern: read cached timings immediately (if present) so UI shows something while network fetch completes.

### 4) Android native ClassCastException (String → Double) on location coordinates
- Problem: The Android native module crashed when JS passed coordinate strings to native APIs expected to be Doubles.
- Fix: Coerced coordinates to numeric types (`parseFloat`/`Number`) throughout the flow — when reading device location, when saving/loading user location, and before calling any native modules.

### 5) Notification scheduling reliability & Expo Go limitations
- Problem: Scheduling notifications caused inconsistencies and warnings; also Expo Go lacks full notification features.
- Fix: Hardened `notificationService`:
  - Validate inputs and skip invalid times
  - Log scheduling payloads to debug what gets scheduled
  - Use seconds-based triggers for cross-platform stability
  - Added notes in the README about dev-client requirements for full notification testing

### 6) UX improvements and layout issues
- Problem: Several screens weren't scrollable, the Settings screen had an unnecessary calculation-method control, and Qibla needed web fallbacks.
- Fixes:
  - Made Tasbih, PrayerTimes, and Settings scrollable (`ScrollView`, `SafeAreaView`)
  - Removed calculation-method UI from Settings per the brief
  - Added manual city selection and persisted the selection
  - Added compass fallbacks when magnetometer isn't available (show a banner on web)

## Code-level fixes (files I changed)
- `screens/PrayerTimesScreen.js` — cached-first load, guard against null, manual city selection, location fallback, `parseFloat` coordinates, logs
- `services/notificationService.js` — input validation, seconds-based triggers, logging
- `components/Header.js` — removed module-scope color access; moved to render-time
- `screens/HomeScreen.js` — removed module-scope theme access
- `screens/SettingsScreen.js` — scrollable, developer name update, removed calculation method control
- `utils/dateUtils.js` — fixed hijri conversion input handling
- `utils/storageUtils.js` — coerce lat/lon to `Number` on save/load
- `app.json` — app name changed to "Daust pro"
- `package.json` — added author
- `.gitignore` — fixed to ignore `debug.keystore`
- `README.md`, `START_APP.md` — updated with final-run instructions and notes
- `prepare_and_push.ps1` — helper script (for local use) to prepare and push to GitHub safely

## Testing & verification
- Added console logs around PrayerTimes loading path (`[PrayerTimes]` prefix) to track cache → location → API flow.
- Manually tested on Expo Go and emulator for UI flow; noted Expo Go limitations for push notifications and documented them.
- Normalized coercion checks to avoid native exceptions.

## Quick "how to run" (what I will say in the demo)
- `npm install`
- `npx expo start --clear`
- Open on device with Expo Go (or use a dev client for full notification features)
- Open Prayer Times screen — it should show cached times immediately, then refresh.

## Likely questions & suggested answers (practice these)

1) **Q:** What stack did you use and why?
   **A:** React Native with Expo — fast iteration, cross-platform UI, and easy access to sensors and notifications. Expo sped up development and simplified builds for this project.

2) **Q:** How did you handle time zone and date edge cases?
   **A:** I used a cached-first approach, normalized input dates, and convert to proper local times via `timeUtils`. For Hijri I used guarded conversions (avoid null inputs). I also check date changes every minute and refresh prayer times if day boundaries cross.

3) **Q:** How did you debug the crashes?
   **A:** I added targeted console logs, reproduced crashes in Expo, traced stack traces to module-eval time and render-time issues, then applied guarded checks and moved theme accesses into render-time.

4) **Q:** What did you change to prevent native Android crashes?
   **A:** Ensured all coordinates passed to native modules are Numbers (`parseFloat`/`Number`) and validated data before scheduling notifications (skip invalid values).

5) **Q:** How do notifications work and what are their limitations?
   **A:** Notifications are scheduled locally with `expo-notifications`; for full remote push and some Android registration features you need a dev client or standalone build — Expo Go doesn't support all flows. I added logs to verify scheduled times.

6) **Q:** How would you remove a secret that was already committed to git history?
   **A:** Use BFG Repo-Cleaner or `git filter-repo` to rewrite history, then force-push. It's disruptive and needs team coordination; I can prepare exact commands if needed.

7) **Q:** What would you improve next?
   **A:** Add CI checks, unit tests for `timeUtils`, automated end-to-end smoke tests for key screens, and a dev-client build pipeline for notification testing.

8) **Q:** How did you ensure the UI is responsive for different devices?
   **A:** Used `SafeAreaView`, `ScrollView`, flex layout, and avoided fixed heights; tested on emulators and a device.

9) **Q:** Any trade-offs?
   **A:** Using Expo speeds development, but some native features require dev/staged builds. Also I favored defensive coding to avoid runtime crashes rather than heavier refactors to the architecture given the deadline.

10) **Q:** How would you scale this to multiple locales or different calculation methods?
    **A:** The app already supports calculation methods; we can expose more options, fetch localized strings, and centralize the calculation method state in a settings store.

## Short demo script (2 minutes)
- Open the app, show Home, tap into Prayer Times — point out cached timings and auto-refresh.
- Open Location settings: show manual city selection and toggle auto-location.
- Open Qibla: demonstrate compass; if on web, show the fallback banner.
- Show settings: note developer name and removed calculation-method control.
- Trigger a local scheduled notification (if using dev build), show console logs for scheduled notifications.

## Journal / timeline (short)
- Day 1: Initial setup, basic screens, and API integration.
- Day 2: Added magnetometer/compass and Tasbih UI.
- Day 3: Upgraded Expo and hit startup ReferenceError — fixed theme module-scope usage.
- Day 4: Found and fixed hijri conversion and render-time null mapping in PrayerTimes.
- Day 5: Hardening notifications and numeric coercions; added README/START_APP and prepared push helper.

## Lessons learned (personal)
- Be careful with module-eval side effects — don't call hooks or theme values at import time.
- Always validate data before passing to native modules.
- Cached-first UX greatly improves perceived performance for network-backed UIs.
- Document environment-specific caveats (Expo Go vs dev clients) clearly — saved debugging time for reviewers.

## Next steps / follow-ups I can do
- Add unit tests for `timeUtils` and `dateUtils`.
- Add a CI pipeline and a build profile for a dev-client to test notifications.
- Purge any secrets from git history if you confirm they're present.
- Revert the temporary hard-coded UI (if I add it) once you finish screenshots.


---

*If you want this saved as a condensed one-page summary, or exported as PDF, tell me which format and I'll create it.*