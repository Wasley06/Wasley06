# Fabegon ERP

Fabegon ERP is a React, Vite, and Tauri v2 desktop application.

## Local Development

Prerequisites:

- Node.js 20 or newer
- Rust stable and Windows build tools only if you want to build locally

Install and run the frontend locally:

```sh
npm install
npm run dev
```

Run the Tauri desktop app locally:

```sh
npm run tauri dev
```

## Windows Installer Cloud Build

The Windows installer is built in GitHub Actions, so your local computer does not need Visual Studio Build Tools, the Rust toolchain, or Tauri build dependencies for distribution builds.

### 1. Push Fabegon ERP to GitHub

Create a GitHub repository, then push this project:

```sh
git add .
git commit -m "Setup Fabegon ERP Windows installer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fabegon-erp.git
git push -u origin main
```

### 2. Trigger the Cloud Build

The workflow runs automatically when you push to the `main` branch. You can also trigger it manually:

1. Open the GitHub repository.
2. Select the `Actions` tab.
3. Select `Build Windows Installer`.
4. Select `Run workflow`.

### 3. Download the Installer Artifact

After the workflow finishes:

1. Open the completed `Build Windows Installer` workflow run.
2. Scroll to `Artifacts`.
3. Download `Fabegon-ERP-Windows-Installer`.
4. Extract the downloaded artifact zip.
5. Run the generated `Fabegon ERP` setup `.exe`.

The uploaded installer is produced from:

```text
src-tauri/target/release/bundle/nsis/*.exe
```

## Installer Branding

The Tauri bundle configuration brands the Windows installer and executable as:

- Application name: `Fabegon ERP`
- Identifier: `com.fabegon.erp`
- Publisher: `Wasley Inc.`
- Icon source: `src/assets/images/fabegon-logo.png`
- Generated icons: `src-tauri/icons/`
