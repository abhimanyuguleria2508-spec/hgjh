# Kalichindi QR Code Inventory Management System - Desktop Version

## Building the Desktop Application

### Prerequisites
1. Node.js 20+ and Yarn
2. Python 3.11+
3. MongoDB (optional for production build)

### Development Mode

1. **Start Backend**:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

2. **Start Frontend in Electron**:
```bash
cd frontend
yarn install
yarn electron:dev
```

### Production Build

#### Step 1: Build Frontend
```bash
cd frontend
yarn build
```

#### Step 2: Package Backend (Optional - for full offline support)
```bash
cd backend
pip install pyinstaller
pyinstaller --onefile --name server server.py
# This creates backend/dist/server.exe (Windows) or backend/dist/server (Linux/Mac)
```

#### Step 3: Build Electron App
```bash
cd frontend
yarn electron:build
```

This will create installers in `frontend/dist/` directory:
- **Windows**: `Kalichindi Inventory System Setup.exe`
- **Mac**: `Kalichindi Inventory System.dmg`
- **Linux**: `Kalichindi-Inventory-System.AppImage`

### Simplified Build (Frontend Only)

If you want a simpler build without bundling the backend:

```bash
cd frontend
yarn build
yarn electron:build
```

Users will need to:
1. Install and run MongoDB locally
2. Start the backend separately: `python -m uvicorn server:app --host 0.0.0.0 --port 8001`
3. Run the Electron app

### File Sizes
- **With bundled backend**: ~200-300 MB
- **Frontend only**: ~150-200 MB

### Features in Desktop Version
- ✅ Native window controls
- ✅ System tray integration (optional)
- ✅ Auto-updates (can be configured)
- ✅ Full offline support with IndexedDB
- ✅ Native notifications
- ✅ File system access for exports
- ✅ Better performance than web version

### Distribution

The built installer can be distributed to users who can simply:
1. Download the installer
2. Run it (one-click install)
3. Launch "Kalichindi Inventory System" from desktop/start menu

### Notes
- The app uses the same codebase as the web version
- All data is stored locally using IndexedDB
- MongoDB is optional if you convert to SQLite for simpler deployment
- QR scanner works with USB cameras or built-in webcams
