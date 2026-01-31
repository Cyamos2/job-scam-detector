# 🚀 Scamicide - Deployment Guide

## Free Deployment Options

### Option 1: Expo Go (Development) - Completely Free
- **Best for**: Quick testing, development builds
- **Cost**: Free
- **Setup time**: 5 minutes
- **Limitations**: Cannot submit to app stores

### Option 2: EAS Build (Production Builds) - Free Tier Available
- **Best for**: Beta testing, internal distribution
- **Cost**: Free tier includes 30 build minutes/month
- **Produces**: .apk (Android) and .ipa (iOS) files
- **Can submit to**: Google Play (Internal/Alpha), TestFlight

### Option 3: Google Play Internal Testing - Free
- **Best for**: Distributing to testers before public release
- **Cost**: $25 one-time developer registration
- **Setup time**: 30 minutes

---

## Quick Start: Development Mode (Expo Go)

```bash
# Install dependencies
npm install

# Start development server
npm run start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Or scan QR code with Expo Go app on your phone
```

---

## Production Build with EAS (Recommended)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
# or create an account at https://expo.dev
```

### 3. Configure EAS Build
```bash
eas build:configure
```

This creates `eas.json` with build profiles.

### 4. Build for Android (APK)
```bash
# Development build
eas build --platform android --profile development

# Production build (for Play Store)
eas build --platform android --profile production
```

### 5. Build for iOS (IPA)
```bash
# Development build (for simulator)
eas build --platform ios --profile simulator

# Production build (for TestFlight/App Store)
eas build --platform ios --profile production
```

> **Note**: iOS builds require Apple Developer Account ($99/year)

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```env
# API URL for production (update after deploying backend)
EXPO_PUBLIC_API_URL=https://your-api-domain.com

# Sentry DSN (optional - for error tracking)
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Sentry minimum log level (debug|info|warning|error|fatal)
EXPO_PUBLIC_SENTRY_MIN_LEVEL=warning
```

---

## Deploying to Google Play (Internal Testing)

### 1. Create Google Play Developer Account
- Visit https://play.google.com/console
- Pay $25 registration fee
- Create your developer profile

### 2. Prepare Your Build
```bash
# Create production build
eas build --platform android --profile production
```

### 3. Upload to Google Play
1. Go to Google Play Console
2. Create a new app
3. Navigate to **Testing > Internal testing**
4. Upload your `.aab` file (output from EAS)
5. Add tester email addresses
6. Submit for review

---

## Deploying to TestFlight (iOS Beta)

### 1. Apple Developer Program
- Visit https://developer.apple.com
- Join for $99/year
- Create App ID for your app

### 2. Configure iOS Build
Update `app.json` with your bundle identifier:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.scamicide",
      "infoPlist": {
        "NSCameraUsageDescription": "...",
        "NSPhotoLibraryUsageDescription": "..."
      }
    }
  }
}
```

### 3. Build and Submit
```bash
# Create production build
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

---

## Backend Deployment (For API Features)

### Free Options

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| **Render.com** | 750 hrs/month | SQLite supported |
| **Railway** | $5 credit/month | Easy deployment |
| **Fly.io** | 3 shared VMs | Good for small apps |
| **Cyclic.sh** | Free | Node.js focused |

### Deploy Server to Render (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Visit https://render.com
   - Connect your GitHub

3. **Create Web Service**
   - Select your repository
   - Root directory: `server`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Plan: Free

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=file:./dev.db
   ```

5. **Update App Configuration**
   ```bash
   # Set the API URL in your app
   expo env set EXPO_PUBLIC_API_URL=https://your-render-domain.com
   ```

---

## Network Configuration

### Android Permissions
The app requires these permissions (already configured):
- `CAMERA` - For taking photos
- `READ_EXTERNAL_STORAGE` - For accessing screenshots
- `READ_MEDIA_IMAGES` - For Android 13+

### Server CORS
The server is configured to accept requests from:
- Development: `exp://localhost:8081`, `http://localhost:8081`
- Production: Update `server/src/middleware/security.ts` with your app's domain

---

## Troubleshooting

### Build Fails with Memory Error
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
eas build --platform android
```

### Android Build Issues
```bash
# Clean build cache
cd android
./gradlew clean
cd ..
eas build --platform android --profile production
```

### iOS Build Fails on macOS
```bash
# Install CocoaPods dependencies
cd ios
pod install
cd ..
```

---

## Estimated Costs

| Item | Cost |
|------|------|
| Expo Account | Free |
| EAS Build (free tier) | Free (30 min/month) |
| Google Play Developer | $25 (one-time) |
| Apple Developer Program | $99/year |
| Backend (Render free tier) | Free |

**Total to launch**: $25 (Google Play) or $99/year (iOS)

---

## Next Steps

1. [ ] Run `eas login` and configure your account
2. [ ] Update `app.json` with your app details
3. [ ] Create production build: `eas build --platform android --profile production`
4. [ ] Upload to Google Play Console
5. [ ] Add testers and publish

