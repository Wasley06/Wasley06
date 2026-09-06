# Fabegon ERP – Native Application Packaging & Tauri Integration

This documentation explains how the **Fabegon ERP** is packaged into a high-performance, commercially installable native desktop and mobile application using **Tauri v2**. 

All existing business logic, frontend code, database layers, local offline synchronization, and styling remain fully preserved.

---

## 🏗️ Architecture & Native Integration

- **Framework**: Tauri v2 (Desktop & Mobile)
- **Frontend**: React 19 + Vite 6 + Tailwind CSS
- **Backend/Native Core**: Rust (delivering ultra-lightweight binaries, native window integration, and secure file system access)
- **Installer Engines**: 
  - **NSIS**: Generates a professional Windows Setup wizard (`Setup.exe`) with support for installing into *Program Files*, creating desktop shortcuts, start menu shortcuts, and a registered uninstaller.
  - **WiX Toolset**: Generates clean corporate enterprise `MSI` installers.
  - **Android Gradle/NDK**: Generates installable standalone `APK` and Google Play-ready `AAB` packages.

---

## 🛠️ Local Development & Build Setup

### Prerequisites
To build the native application locally, you must install the following tools:
1. **Node.js** (v20+)
2. **Rust & Cargo**: Run `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
3. **Windows Dependencies** (Only if building on Windows):
   - Visual Studio Build Tools (C++ development workload)
   - WiX Toolset v3 (For building MSI packages)

### Commands

#### 1. Setup Project & Dependencies
```bash
npm install
```

#### 2. Run in Local Native Development Mode
This launches the Vite dev server, compiles the Rust core, and opens a native OS window running the ERP:
```bash
npm run tauri:dev
```

#### 3. Build Production Desktop Installer Locally
This command bundles all web assets, compiles optimized Rust binaries, and packages them into professional installer formats:
```bash
npm run tauri:build
```
*Output artifacts will be generated in:*
- **Windows NSIS Setup (`.exe`)**: `src-tauri/target/release/bundle/nsis/Fabegon_ERP_Setup.exe`
- **Windows MSI Package (`.msi`)**: `src-tauri/target/release/bundle/msi/Fabegon_ERP.msi`
- **macOS Disk Image (`.dmg`)**: `src-tauri/target/release/bundle/dmg/...`
- **Linux Debian Package (`.deb`)**: `src-tauri/target/release/bundle/deb/...`

#### 4. Generate Application Icons
If you change the source logo, you can automatically regenerate all multi-size icons for Windows, macOS, Android, and iOS using the Tauri utility:
```bash
npx tauri icon ./src/assets/images/fabegon_logo_1784381190199.jpg
```

---

## 🚀 GitHub Actions Continuous Integration / Release Pipeline

We have configured two workflows in `.github/workflows/` that automatically compile and publish native binaries whenever a version tag is pushed:

1. **`tauri-build-desktop.yml`**: Compiles desktop apps on three matrix environments (Windows, macOS, and Linux) and uploads them directly to the associated GitHub Release.
2. **`tauri-build-android.yml`**: Uses Java JDK, Android SDK/NDK, and Gradle to compile Android APKs and AAB bundles, appending them to the same release.

### Deploying a New Release
To create and distribute a new commercial build:
```bash
# 1. Update version number in package.json and src-tauri/tauri.conf.json (e.g., 1.0.1)
# 2. Tag the release in Git
git tag -a v1.0.1 -m "Release v1.0.1"

# 3. Push the tag to GitHub
git push origin v1.0.1
```
The workflows will execute, package the installers, create a GitHub Release, and publish:
- `Fabegon_ERP_Setup.exe` (Windows Installer)
- `Fabegon_ERP.msi` (Enterprise MSI Installer)
- `Fabegon_ERP.dmg` (macOS Installer)
- `fabegon-erp.apk` (Android Standalone App)
- `fabegon-erp.aab` (Google Play Store Bundle)

---

## 🔄 Automatic Update Functionality

The Tauri Auto-Updater is fully integrated. The application queries the update server at launch:

- **Configured Feed**: `https://raw.githubusercontent.com/wasleydev/fabegon-erp/main/updater.json`
- **Security Signing**: Updates are validated using cryptographic signatures. You can generate a private/public key pair by running:
  ```bash
  npx tauri signer generate
  ```
  Set the public key inside `/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`. Provide the private key as a GitHub Secret (`TAURI_PRIVATE_KEY`) to let GitHub Actions securely sign update bundles.

---

## 💾 Offline Operations & Data Integrity

Our offline-first synchronization architecture guarantees flawless operation even when disconnected:
1. **Local Storage Persistence**: The localized client DB, session tokens, and configurations are securely cached.
2. **Sync Queue Service**: Any CRUD actions performed while offline are immediately placed in a transaction queue (`fabegon_sync_queue`).
3. **Background Reconnection Daemon**: When an internet connection is detected, the background service replays queued operations sequentially, records synchronization logs in the Audit Panel, and issues live notifications.
