# Start the App — Daust Pro

This file explains simple steps to run the app locally for development and testing.

## Quick steps

1. Stop any running Expo servers (if any): press `Ctrl+C` in the terminal.
2. Clear cache and start Metro:

```powershell
npx expo start --clear
```

3. Run on your preferred target:

- Physical device (recommended): install Expo Go, scan the Metro QR code.
- Android emulator: `npm run android` (Android Studio/emulator required).
- iOS simulator (macOS): `npm run ios`.
- Web: `npm run web`.

## Important notes for this project

- App name: Daust Pro
- Developer: Cheikh El Hadji Malick Niang
- The Prayer Times screen uses a cached-first UX: cached timings are shown immediately, then refreshed from the API when available.
- Manual city selection is persisted. Toggle auto-location in the Location Settings to switch between device GPS and manual city.
- Notification scheduling is implemented, but full push/notification testing on Android requires a dev client or standalone build (Expo Go has limitations).

## Troubleshooting

- "Unable to resolve module": delete `node_modules`, then `npm install`, then `npx expo start --clear`.
- QR code not working: ensure device and development machine are on the same network, or run emulator/simulator locally.
- Location problems: grant location permissions and ensure location services are enabled.

## Useful commands

```powershell
npx expo start --clear  # start Metro with cleared cache
npm run android         # start Android emulator
npm run ios             # start iOS simulator (macOS only)
npm run web             # run in browser
```

If you want me to prepare a local script to help push to GitHub safely, I created `prepare_and_push.ps1` in the repository; run it locally to perform the push steps. I cannot execute the push from here.



