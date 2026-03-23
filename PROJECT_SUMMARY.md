# Daust Pro — One‑Page Project Summary

Quick overview

I built Daust Pro with React Native + Expo: a mobile app that shows prayer times, a Qibla compass, a Tasbih counter, and an Islamic calendar. The app focuses on reliability (cached-first data), simple UX (manual city selection), and cross-platform safety (coerced numeric types before native calls).

Key features (at-a-glance)

- Prayer times with cached-first display & Aladhan API fallback
- Qibla compass using magnetometer (web fallback shown when unavailable)
- Tasbih counter and Islamic calendar (Hijri support)
- Local notification scheduling for prayer reminders (dev-client needed for full Android push)
- Manual city selection with persisted user location and auto-location toggle

Big problems fixed (short)

- Startup crash from theme values used at module load → moved theme access into render or used static Colors
- PrayerTimes render crash when data was null → initialized to {} and used cached-first UI
- Native Android ClassCastException for coords → parseFloat/Number on all lat/lon values
- Notification scheduling issues → added validation, logging, and seconds-based triggers

How to run (fast)

```powershell
npm install
npx expo start --clear
# open with Expo Go or use emulator (or dev client for notifications)
```

Very short demo script (30–60s)

1. Open app → Home → Tap Prayer Times (shows cached times immediately).
2. Open Location settings → toggle auto-location or pick a city.
3. Open Qibla → show compass (or show web fallback).

3 quick Q&A (practice answers)

- Q: Why Expo? — Fast development, easy sensor & notification access; dev-client covers native gaps.
- Q: How did you stop crashes? — Defensive coding: guard nulls, avoid hooks at module scope, coerce types before native calls.
- Q: Notifications working? — Local scheduling works; full Android push requires a dev client or standalone build.

One-sentence takeaway

Built a stable, mobile-focused prayer app with defensive fixes that prevent startup and native crashes while keeping UX snappy with cached-first data.

If you want this even shorter (one-liner + 3 bullets) or formatted for copy/paste into your submission, tell me which style and I'll update the file.
