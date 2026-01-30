# 🛡️ Scamicide
**Spray away job scams — stay safe, stay hired.**

Scamicide is a **React Native + Expo mobile app** that helps job seekers detect scam postings before they cause harm.  
The app scans job descriptions, links, and even screenshots to flag risky signals and calculate a **scam risk score**.

---

## 🚀 Features
- 🔎 **Job Link & Text Analysis**  
  Detects red-flag keywords in job postings (e.g., "pay upfront", "wire money")  

- 🖼️ **Screenshot Scanner**  
  OCR support to read job descriptions from screenshots (server-side Tesseract fallback; optionally use on-device ML Kit for better privacy/accuracy — requires prebuild/EAS).  

- 📊 **Risk Assessment Meter**  
  Shows a score from **0–100** with Low / Medium / High risk labels  

- 🗂️ **Local Database**  
  Save past scans using **SQLite** (expo-sqlite)  

- 🎨 **Modern UI / UX**  
  - Dark & light theme toggle  
  - Risk sensitivity controls  
  - Domain-age boost option  

- ⚙️ **Settings Page**  
  - Toggle dark mode  
  - Adjust scam sensitivity  
  - Enable/disable domain-age boost  
  - Clear saved database  
  - About section with app info  

---

## 📱 Screenshots


- Home Screen  
- Verify Job Posting  
- Risk Assessment  
- Screenshot Scan  
- Settings  

---

## 🛠️ Tech Stack
- **React Native + Expo** (cross-platform mobile framework)  
- **TypeScript**  
- **SQLite (expo-sqlite)** — local database  
- **OCR (expo-image-picker + text recognition library)**  
- **React Navigation** — tab + stack navigation  

---

## ⚡ Getting Started

### Prerequisites
- Node.js + npm  
- Expo CLI installed (`npm install -g expo-cli`)  

### Installation
```bash
# Clone the repo
git clone https://github.com/Cyamos2/scamicide-app.git
cd scamicide-app

# Install dependencies
npm install

# Start Expo

## On-device OCR (ML Kit) — optional
If you want to use on-device OCR for better privacy and speed, follow these steps:

1. Install dependencies (already added to package.json):
   - `react-native-mlkit-text-recognition`
   - `expo-file-system`
2. Prebuild native projects and install pods (required for ML Kit):
   - `npx expo prebuild` (or use EAS Build)
   - `cd ios && pod install` (on macOS)
3. Build the app with EAS or run via Xcode/Android Studio (ML Kit requires native build).

Notes:
- On-device OCR improves privacy (no image upload) and usually gives better accuracy. It requires a native build (EAS or bare workflow).
- If ML Kit is not available at runtime, the app will gracefully fall back to the server-side OCR (Tesseract) or demo text.

npm run start
