#!/bin/bash

# 🚀 Scamicide - Quick Deploy Script
# This script helps you deploy your app quickly

echo "================================================"
echo "  🚀 Scamicide - Quick Deploy"
echo "================================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if logged in
echo "🔐 Checking Expo login status..."
eas whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in. Please run: eas login"
    echo "   Or visit https://expo.dev to create an account"
    exit 1
fi

echo "✅ Logged in to Expo"
echo ""

# Menu
echo "Select an option:"
echo "  1) 🏗️ Build for Android (APK)"
echo "  2) 🍎 Build for iOS (IPA)"
echo "  3) 🔨 Build for both platforms"
echo "  4) 📱 Build for development testing"
echo "  5) 🚀 Build & submit to Google Play"
echo "  6) 📋 Show build status"
echo "  0) ❌ Exit"
echo ""
read -p "Enter your choice [0-6]: " choice

case $choice in
    1)
        echo ""
        echo "🏗️ Building for Android..."
        eas build --platform android --profile production
        ;;
    2)
        echo ""
        echo "🍎 Building for iOS..."
        eas build --platform ios --profile production
        ;;
    3)
        echo ""
        echo "🔨 Building for both platforms..."
        eas build --platform all --profile production
        ;;
    4)
        echo ""
        echo "📱 Building for development testing..."
        eas build --platform all --profile development
        ;;
    5)
        echo ""
        echo "🚀 Building and submitting to Google Play..."
        eas build --platform android --profile production
        if [ $? -eq 0 ]; then
            eas submit --platform android
        fi
        ;;
    6)
        echo ""
        echo "📋 Recent builds..."
        eas build:list
        ;;
    0)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "  ✅ Done!"
echo "================================================"

