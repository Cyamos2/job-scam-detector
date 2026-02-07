# iOS Build Workaround

## Issue
xcodebuild cannot find matching iOS simulators due to SDK version mismatch between Xcode (iOS 26.0 SDK) and simulator runtime (iOS 18.6).

## Working Solutions

### Option 1: Use Expo Go (Recommended for Development)
This is the fastest way to test your app:

```bash
# Start the Metro bundler
npm start

# Scan the QR code with Expo Go app on your iPhone
# OR press 'i' in the terminal to open in iOS simulator with Expo Go
```

1. Install **Expo Go** from the App Store on your iPhone
2. Run `npm start` in your project 
3. Scan the QR code with your camera
4. App opens instantly in Expo Go

### Option 2: Build from Xcode GUI
Since CLI builds are failing, build directly in Xcode:

```bash
# Open the project in Xcode
open ios/JobScamDetector.xcworkspace
```

Then in Xcode:
1. Select **iPhone 16 Pro** (or any simulator) from the device dropdown (top bar)
2. Press **⌘ + R** or click the Play button to build and run
3. The app should build successfully

### Option 3: Build with EAS (For Production)
For production builds:

```bash
# Build APK for Android
eas build --platform android --profile production

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

## Root Cause
The  issue is a mismatch between:
- **SDK Version**: iOS 26.0 (Xcode SDK)
- **Runtime Version**: iOS 18.6 (Simulator Runtime)
- xcodebuild's device matching algorithm fails to resolve this properly

## Temporary Fix Attempts
We've tried:
- ✅ Cleaned build artifacts  
- ✅ Reinstalled CocoaPods successfully
- ✅ Reset Xcode derived data
- ✅ Specified simulator by name and ID
- ❌ xcodebuild still fails with "destination matching" error

## Next Steps
1. **For immediate testing**: Use Expo Go (Option 1)
2. **For native builds**: Use Xcode GUI (Option 2)
3. **For production**: Use EAS Build (Option 3)

The app code is working fine - this is purely an Xcode/simulator configuration issue.
