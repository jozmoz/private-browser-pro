const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const mockProfiles = [
  {
    id: 'p1',
    name: 'Instagram VIP Account (Trading & Dropshipping Operations)',
    color: '#4f8cff',
    startupUrl: 'https://instagram.com/direct',
    saveData: true,
    tags: ['Instagram', 'Crypto', 'VIP', 'US-Proxy'],
    notes: 'Recovery email: backup@gmail.com. Do not change password without 2FA.',
    lastLaunched: Date.now() - 3600000,
    fingerprint: {
      os: 'windows',
      webglGpuName: 'NVIDIA GeForce RTX 4070',
      webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      hardwareConcurrency: 8,
      deviceMemory: 16,
      screenWidth: 1920,
      screenHeight: 1080,
      timezone: 'America/New_York',
      language: 'en-US'
    },
    proxy: {
      enabled: true,
      type: 'socks5',
      host: 'residential.premium-proxy.net',
      port: 1080
    }
  },
  {
    id: 'p2',
    name: 'حساب تلگرام پشتیبانی و مارکتینگ اصلی',
    color: '#22c55e',
    startupUrl: 'https://web.telegram.org',
    saveData: false,
    tags: ['تلگرام', 'مارکتینگ', 'فوری'],
    notes: 'اکانت بدون دیتا - با بستن پنجره تمام کوکی‌ها پاک می‌شوند.',
    lastLaunched: null,
    fingerprint: {
      os: 'mac',
      webglGpuName: 'Apple M3 Max',
      webglRenderer: 'ANGLE (Apple, Apple M3 Max, OpenGL 4.1)',
      hardwareConcurrency: 12,
      deviceMemory: 32,
      screenWidth: 2560,
      screenHeight: 1440,
      timezone: 'Europe/Berlin',
      language: 'de-DE'
    },
    proxy: null
  },
  {
    id: 'p3',
    name: 'Binance & Bybit Trader Pro',
    color: '#f59e0b',
    startupUrl: 'https://binance.com',
    saveData: true,
    tags: ['Crypto', 'Binance', 'Trading'],
    notes: '',
    lastLaunched: Date.now() - 86400000 * 3,
    fingerprint: {
      os: 'linux',
      webglGpuName: 'AMD Radeon RX 7900 XTX',
      webglRenderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
      hardwareConcurrency: 16,
      deviceMemory: 32,
      screenWidth: 1920,
      screenHeight: 1080,
      timezone: 'Asia/Singapore',
      language: 'en-US'
    },
    proxy: {
      enabled: true,
      type: 'http',
      host: '142.93.197.29',
      port: 8080
    }
  }
];

// Register IPC handlers so renderer works perfectly
ipcMain.handle('profiles:list', () => mockProfiles);
ipcMain.handle('status:running', () => ({ running: ['p1'], counts: { p1: 1 } }));
ipcMain.handle('status:chromium', () => ({ found: true, path: 'chrome.exe', name: 'jozmoz' }));
ipcMain.handle('status:dataFolder', () => 'C:\\UserData');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, '../../preload.js'),
      contextIsolation: true
    }
  });

  await win.loadFile(path.join(__dirname, '../../index.html'));
  await win.webContents.executeJavaScript(`
    if (localStorage.getItem('app_lang') !== 'en') {
      localStorage.setItem('app_lang', 'en');
      window.location.reload();
    }
  `);
  await new Promise(r => setTimeout(r, 1000));

  const artifactDir = 'C:/Users/milad/.gemini/antigravity-ide/brain/d72bff82-4770-40a5-b025-5a5a27aff59d';
  
  // 1. Capture cards on desktop (English LTR)
  const cardsDesktop = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'cards_desktop.png'), cardsDesktop.toPNG());
  console.log('Saved cards_desktop.png');

  // 2. Open modal (Tab 1) and capture
  await win.webContents.executeJavaScript(`
    document.getElementById('btnHeaderNew').click();
  `);
  await new Promise(r => setTimeout(r, 500));
  const modalScreen = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'modal_desktop.png'), modalScreen.toPNG());
  console.log('Saved modal_desktop.png');

  // 3. Switch to Tab 2 (Identity) and capture
  await win.webContents.executeJavaScript(`
    document.querySelector('.modal-tab-btn[data-tab="tabFingerprint"]').click();
  `);
  await new Promise(r => setTimeout(r, 500));
  const modalTab2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'modal_tab2.png'), modalTab2.toPNG());
  console.log('Saved modal_tab2.png');

  // 4. Switch to Persian and capture in RTL
  await win.webContents.executeJavaScript(`
    document.getElementById('profileModalClose').click();
    document.getElementById('btnLangToggle').click();
  `);
  await new Promise(r => setTimeout(r, 600));
  const rtlCards = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'cards_rtl.png'), rtlCards.toPNG());
  console.log('Saved cards_rtl.png');

  // 5. Test compact window size (750x560)
  win.setSize(750, 560);
  await new Promise(r => setTimeout(r, 500));
  const compactCards = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'cards_compact.png'), compactCards.toPNG());
  console.log('Saved cards_compact.png');

  // Open modal in compact window to ensure buttons are never cut off
  await win.webContents.executeJavaScript(`
    document.getElementById('btnHeaderNew').click();
  `);
  await new Promise(r => setTimeout(r, 500));
  const compactModal = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'modal_compact.png'), compactModal.toPNG());
  console.log('Saved modal_compact.png');

  win.close();
  app.quit();
});
