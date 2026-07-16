# Hisaab 📒
> Your personal finance tracker — cash, bank, work hours, splits, credit cards and more.

Built with **React Native + Expo (SDK 57)**. Works on Android as a standalone APK.

---

## What the app does

- Track **cash** and **bank (Chase)** balance separately
- Log **work hours** per job location with custom pay rates
- Track **split payments** (who owes you / you owe)
- Manage **credit cards** — balances, limits, payments
- Set **reminders** for pending payments with due dates
- **Monthly charts** — income vs expense bar chart, expense pie chart
- **Low balance alert** — warns when balance drops below your threshold
- **Receipt scanning** — photo → Claude AI fills in the details
- All data stored locally on device with AsyncStorage

---

## Requirements

Make sure these are installed before setting up:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | LTS (v20+) | https://nodejs.org |
| npm | comes with Node | — |
| Git | any | https://git-scm.com |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Expo Go app | latest | Android Play Store |

---

## First Time Setup (after cloning)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/HisaabApp.git
cd HisaabApp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Fix AsyncStorage native linking
```bash
npx expo install @react-native-async-storage/async-storage
```

### 4. Run the app (development)
```bash
npx expo start --tunnel
```
- Download **Expo Go** from Play Store on your Android phone
- Scan the QR code shown in terminal
- App opens live on your phone

---

## Project Structure

```
HisaabApp/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              ← Root layout (SafeAreaProvider + HisaabProvider)
│   │   └── (tabs)/
│   │       ├── _layout.tsx          ← Bottom tab navigation (emoji icons)
│   │       ├── index.tsx            ← Home screen (balances, alerts, summary)
│   │       ├── add.tsx              ← Add income/expense (+ receipt scanner)
│   │       ├── hours.tsx            ← Work hours tracker (jobs, rates, pay)
│   │       ├── money.tsx            ← Split / Credit cards / Reminders
│   │       ├── summary.tsx          ← Monthly charts (bar + pie)
│   │       └── history.tsx          ← Transaction history with delete
│   ├── components/
│   │   └── Screen.tsx               ← Shared wrapper (safe area + keyboard avoid)
│   ├── context/
│   │   └── HisaabContext.tsx        ← Global data state + AsyncStorage
│   └── constants/
│       └── theme.ts                 ← Colors, helpers, default data
├── assets/                          ← App icons and splash screen
├── app.json                         ← Expo app config
├── eas.json                         ← Build config (preview = APK)
├── package.json                     ← All dependencies
└── README.md                        ← This file
```

---

## Key Dependencies

```json
"expo": "~57.0.4",
"react-native": "0.86.0",
"expo-router": "~57.0.4",
"@react-native-async-storage/async-storage": "^3.1.1",
"react-native-chart-kit": "^7.0.1",
"react-native-svg": "^15.15.5",
"expo-image-picker": "~57.0.2",
"react-native-safe-area-context": "~5.7.0",
"react-native-screens": "^4.25.2"
```

Full list is in `package.json`.

---

## Build APK (Android)

To build a standalone APK that works without VS Code or Expo Go:

### 1. Login to Expo
```bash
eas login
```

### 2. Build APK
```bash
eas build -p android --profile preview
```
- Takes **10–15 minutes** (cloud build, no Android Studio needed)
- Download link expires in **30 days** — download and save the APK immediately
- Save the APK to Google Drive as a backup

### 3. Install on phone
- Open the download link on your Android phone
- Settings → Security → Allow unknown sources
- Install the APK
- App works forever after install, no laptop needed

### 4. Rebuild for updates
Any time you change the code:
```bash
eas build -p android --profile preview
```

---

## Receipt Scanning Setup

The receipt scan feature uses the Claude AI API. To enable it:

1. Go to **console.anthropic.com** → get your API key
2. Open `src/app/(tabs)/add.tsx`
3. Line 8 — replace:
```typescript
const ANTHROPIC_KEY = 'YOUR_API_KEY_HERE';
```
with your actual key:
```typescript
const ANTHROPIC_KEY = 'sk-ant-...';
```

> ⚠️ Never commit your API key to GitHub. Add it to `.env` for production.

---

## Common Issues & Fixes

### "Unable to resolve @expo/vector-icons"
The tab layout uses emoji icons — no vector icon package needed. Make sure `src/app/(tabs)/_layout.tsx` does NOT import from `@expo/vector-icons`.

### "Invalid value used as weak map key"
Caused by putting a raw string inside `StyleSheet.create()`. Check `money.tsx` — no primitive values (strings/numbers) directly as StyleSheet entries.

### App works but data lost on reload
```bash
npx expo install @react-native-async-storage/async-storage
npx expo start --clear
```

### Shadow style warnings
Replace `shadowColor/shadowOpacity/shadowRadius/elevation` with:
```javascript
boxShadow: '0 1px 6px rgba(0,0,0,0.07)'
```

### Expo Go says "failed to download remote update"
```bash
npx expo start --tunnel
```
Make sure phone and PC are on same WiFi, or use tunnel mode.

### Tunnel error "@expo/ngrok not found"
Close PowerShell, reopen it, run again. Or:
```bash
npm install @expo/ngrok@^4.1.0
npx expo start --tunnel
```

---

## Updating packages
```bash
npx expo install --check
```
This auto-fixes all packages to the correct version for your Expo SDK.

---

## Future Features Planned
- [ ] Cloud sync (Supabase) so data works across devices
- [ ] Export/Import data as JSON backup
- [ ] iOS build
- [ ] Push notifications for reminders
- [ ] Biometric lock (fingerprint)

---

## Built by
Laksh Agarwal — personal finance tracker for workers who likes track their monthly expenses and earnings with total revenue in cash and bank