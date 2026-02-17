# Building Kalichindi Desktop Application (.exe)

## 🎯 Overview
Convert your Kalichindi QR Inventory System into a standalone desktop application that can be downloaded and installed like any other software.

## 📋 Prerequisites

### Required Software
1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **Python 3.11+** - [Download](https://www.python.org/downloads/)
3. **Yarn** - Install with: `npm install -g yarn`
4. **Git** - [Download](https://git-scm.com/)

### Windows Additional Requirements (for .exe)
- Windows 10/11
- Visual Studio Build Tools (optional, for native modules)

---

## 🚀 Quick Start - Simple Build (Recommended)

This creates a desktop app that still needs the backend running separately (simpler, faster).

### Step 1: Export Code from Emergent
1. Go to your Emergent dashboard
2. Click "Save to GitHub" or "Export Project"
3. Clone to your computer: `git clone <your-repo-url>`

### Step 2: Install Dependencies
```bash
# Navigate to project
cd kalichindi-inventory

# Install frontend dependencies
cd frontend
yarn install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### Step 3: Build the Desktop App
```bash
cd frontend
yarn build
yarn electron:build:win
```

⏳ **Build time**: 5-10 minutes

📦 **Output**: `frontend/dist/Kalichindi Inventory System Setup.exe` (~150 MB)

---

## 🎁 Complete Build - Fully Bundled (Advanced)

This creates a single installer with everything included (backend, database, etc.).

### Additional Prerequisites
```bash
pip install pyinstaller
```

### Step 1: Bundle Backend
```bash
cd backend
pyinstaller --onefile --name server --hidden-import uvicorn --hidden-import motor server.py
# Creates: backend/dist/server.exe
```

### Step 2: Build Frontend with Bundled Backend
```bash
cd ../frontend
yarn build
yarn electron:build:win
```

📦 **Output**: `frontend/dist/Kalichindi Inventory System Setup.exe` (~250 MB)

---

## 🧪 Testing During Development

### Test Electron App Without Building
```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 2: Start Electron app
cd frontend
yarn electron:dev
```

This opens the app in an Electron window instead of a browser.

---

## 📱 Building for Other Platforms

### macOS (.dmg)
```bash
cd frontend
yarn electron:build:mac
```
**Output**: `Kalichindi Inventory System.dmg`

### Linux (.AppImage)
```bash
cd frontend
yarn electron:build:linux
```
**Output**: `Kalichindi-Inventory-System.AppImage`

---

## 📦 What's Included in the Desktop App

✅ Native desktop window with military theme
✅ Full offline support (IndexedDB already implemented)
✅ QR code generation and scanning
✅ PDF export
✅ Desktop notifications
✅ System tray icon (optional)
✅ Auto-start on login (optional)
✅ File system access for better data management

---

## 🎨 Customizing the App

### Change App Icon
1. Create icon files:
   - Windows: `icon.ico` (256x256)
   - Mac: `icon.icns`
   - Linux: `icon.png` (512x512)
2. Place in `/app/public/` folder
3. Rebuild

### Change App Name
Edit `electron-builder.json`:
```json
{
  "productName": "Your Custom Name",
  "appId": "com.yourcompany.appname"
}
```

---

## 🚢 Distributing to Users

### Option 1: Direct Download
1. Upload the `.exe` to Google Drive, Dropbox, or your website
2. Share the link with users
3. Users download and run the installer

### Option 2: Microsoft Store (Windows)
- Requires developer account ($19/year)
- Use `electron-builder` with `--win appx` flag

### Option 3: Auto-Updates
Add update server URL in `electron-builder.json`:
```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "your-repo"
  }
}
```

---

## 🐛 Troubleshooting

### "electron-builder not found"
```bash
cd frontend
yarn add --dev electron-builder
```

### Build fails on Windows
Install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

### App won't start
Check backend is running:
```bash
# Start backend manually
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

### Camera not working
Grant camera permissions:
- Windows: Settings > Privacy > Camera
- Allow the app to access camera

---

## 📊 Build Comparison

| Feature | Web Version | Simple Desktop | Full Desktop |
|---------|-------------|----------------|--------------|
| Size | N/A | ~150 MB | ~250 MB |
| Backend | External | External | Bundled |
| Database | External MongoDB | External MongoDB | Bundled SQLite* |
| Installation | Browser | One-click | One-click |
| Updates | Auto | Manual | Auto (optional) |
| Offline | ✅ | ✅ | ✅ |

*Note: For full desktop, consider converting to SQLite for easier distribution

---

## 🎯 Next Steps After Building

1. **Test the installer** on a clean Windows machine
2. **Create a user guide** for installation
3. **Set up auto-updates** (optional)
4. **Add code signing certificate** for trusted installer (optional, ~$200/year)
5. **Distribute** via your website or app stores

---

## 💡 Tips for Production

1. **Code Signing**: Get a certificate to avoid "Unknown Publisher" warnings
   - DigiCert, Sectigo, or SignPath offer certificates
   - Cost: ~$200-400/year

2. **Installer Customization**: Edit `electron-builder.json` for custom:
   - Welcome screens
   - License agreements
   - Custom install locations

3. **Smaller File Size**:
   - Use `electron-builder` compression options
   - Remove unused dependencies
   - Use `--production` flag

4. **Performance**:
   - Enable hardware acceleration
   - Optimize database queries
   - Use lazy loading for large lists

---

## 📞 Need Help?

- Electron Documentation: https://www.electronjs.org/docs
- electron-builder Guide: https://www.electron.build/
- PyInstaller Guide: https://pyinstaller.org/

---

## ✅ Quick Checklist

- [ ] Node.js and Python installed
- [ ] Dependencies installed (`yarn install`, `pip install`)
- [ ] Backend tested locally
- [ ] Frontend builds successfully (`yarn build`)
- [ ] Electron app tested in dev mode (`yarn electron:dev`)
- [ ] Desktop app built (`yarn electron:build:win`)
- [ ] Installer tested on clean machine
- [ ] User documentation created
- [ ] Ready to distribute!

---

**Your Kalichindi Inventory System is now a professional desktop application! 🎉**
