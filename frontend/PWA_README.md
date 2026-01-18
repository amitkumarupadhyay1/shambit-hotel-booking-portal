# PWA (Progressive Web App) Features

Your Shambit hotel booking app includes full PWA functionality for a native app experience.

## Features

### 📱 **App Installation**
- **Automatic prompts** on supported browsers (Chrome, Edge, Samsung Internet)
- **Custom install banners** for Android devices
- **Manual installation** instructions for iOS Safari
- **Header install button** for easy access

### 🔄 **Offline Support**
- **Service worker** caches important resources
- **Offline page** when network is unavailable
- **Background sync** for offline actions

### 🎨 **Native Experience**
- **Standalone mode** - runs like a native app
- **Custom app icon** using your logo.png
- **App shortcuts** for quick access to key features
- **Push notifications** ready (when implemented)

## Browser Support

- ✅ **Chrome** (Desktop & Mobile) - Full support with install prompts
- ✅ **Edge** (Desktop & Mobile) - Full support with install prompts
- ✅ **Samsung Internet** - Full support with install prompts
- ✅ **Safari iOS** - Manual installation via "Add to Home Screen"
- ⚠️ **Firefox** - Limited PWA support

## Installation Methods

### **Android (Chrome/Edge)**
1. **Automatic banner** appears after user interaction
2. **Native install prompt** from browser
3. **Manual**: Menu (⋮) → "Add to Home screen"

### **iOS (Safari)**
1. **Manual only**: Share button → "Add to Home Screen"
2. **Instructions shown** automatically for iOS users

### **Desktop**
1. **Install icon** in browser address bar
2. **Header button** when available
3. **Browser menu** options

## Technical Details

### **Files**
- `/manifest.webmanifest` - PWA manifest
- `/sw.js` - Service worker
- `/icon-*.png` - App icons
- `/offline` - Offline fallback page

### **Components**
- `InstallPrompt` - Shows install prompts and instructions
- `AndroidInstallBanner` - Custom banner for Android
- `ServiceWorkerRegistration` - Registers service worker
- `InstallButton` - Header install button

### **Configuration**
- Supports HTTPS in production
- Allows HTTP for local development (192.168.29.45)
- Caches essential resources for offline use
- Handles app updates automatically

## Production Deployment

1. **HTTPS Required** - PWA only works on HTTPS in production
2. **Icon Files** - Ensure all icon files are accessible
3. **Service Worker** - Must be served from root domain
4. **Manifest** - Must be accessible at `/manifest.webmanifest`

Your PWA is production-ready and will provide users with a native app experience! 🚀