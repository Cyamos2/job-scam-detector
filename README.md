# 🛡️ Scamicide

**Spray away job scams — stay safe, stay hired.**

Scamicide is a **React Native + Expo mobile app** that helps job seekers detect scam postings before they cause harm. The app scans job descriptions, links, and even screenshots to flag risky signals and calculate a **scam risk score**.

---

## 🚀 Features

- 🔎 **Job Link & Text Analysis** - Detects red-flag keywords in job postings (e.g., "pay upfront", "wire money")
- 🖼️ **Screenshot Scanner** - OCR support to read job descriptions from screenshots with on-device ML Kit or server-side Tesseract fallback
- 📊 **Risk Assessment Meter** - Shows a score from **0–100** with Low / Medium / High risk labels
- 🗂️ **Local Database** - Save and manage all your job scans locally
- 🎨 **Modern UI/UX** - Dark & light theme toggle, risk sensitivity controls
- ⚙️ **Settings Page** - Configure app behavior, export/import data, clear database

---

## 📱 Screenshots

| Home Screen | Analyze Job | Risk Assessment | Settings |
|-------------|-------------|-----------------|----------|
| ![Home](docs/images/home.png) | ![Analyze](docs/images/analyze.png) | ![Risk](docs/images/risk.png) | ![Settings](docs/images/settings.png) |

---

## 🛠️ Tech Stack

- **React Native + Expo** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React Navigation** - Tab + stack navigation
- **ML Kit** - On-device text recognition (optional)
- **Tesseract.js** - Server-side OCR fallback
- **Sentry** - Error tracking and crash reporting

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo Go app (iOS/Android) or development environment
- For native builds: Xcode (iOS) or Android Studio (Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/scamicide.git
cd scamicide

# Install dependencies
npm install

# Copy environment example and configure
cp .env.example .env

# Start development server
npm run start

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android
```

### Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking | - |
| `EXPO_PUBLIC_SENTRY_MIN_LEVEL` | Minimum log level | `warning` |

---

## 🔧 Configuration

### Sentry Setup (Optional)

1. Create a Sentry project at https://sentry.io
2. Add your DSN to `.env`:

```env
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project
```

### On-Device OCR (ML Kit)

For better privacy and accuracy, enable on-device OCR with ML Kit:

1. Dependencies are already included in `package.json`
2. Prebuild native projects:
   ```bash
   npx expo prebuild
   ```
3. Install pods (iOS/macOS):
   ```bash
   cd ios && pod install
   ```
4. Build with EAS or Xcode/Android Studio

**Note:** ML Kit requires a native build. If unavailable, the app falls back to server-side OCR.

### Server Configuration

The backend server runs separately. To start it:

```bash
cd server
npm install
npm start
```

Server environment variables (in `server/.env`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `SENTRY_DSN` | Server-side Sentry | - |

---

## 🏗️ Building for Production

### Android APK

```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

### iOS IPA

```bash
# Simulator build (free)
eas build --platform ios --profile preview

# Production build (requires Apple Developer)
eas build --platform ios --profile production
```

### EAS Submit

```bash
# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

---

## 📁 Project Structure

```
scamicide/
├── app.json              # Expo configuration
├── package.json          # App dependencies
├── eas.json              # EAS build configuration
├── App.tsx               # Root app component
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core libraries & utilities
│   ├── navigation/       # React Navigation setup
│   ├── theme/            # UI theme configuration
│   └── types/            # TypeScript type definitions
├── server/               # Backend API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Server utilities
│   └── prisma/           # Database schema
├── android/              # Android native project
└── ios/                  # iOS native project
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev) - React Native framework
- [ML Kit](https://developers.google.com/ml-kit) - On-device text recognition
- [Tesseract.js](https://tesseract.projectnaptha.com) - Server-side OCR
- [Sentry](https://sentry.io) - Error tracking

---

## 📞 Support

- 📧 Email: support@scamicide.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/scamicide/issues)
- 📖 Docs: [Documentation](https://scamicide.readthedocs.io)

