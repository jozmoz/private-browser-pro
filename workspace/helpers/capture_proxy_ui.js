const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mockProxies = [
  {
    id: 'prx_1',
    type: 'socks5',
    host: '185.220.101.5',
    port: 1080,
    username: 'vip_user',
    password: 'secretPassword123',
    latencyMs: 142,
    status: 'alive',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    lastTested: Date.now() - 120000
  },
  {
    id: 'prx_2',
    type: 'http',
    host: '142.93.12.88',
    port: 8080,
    username: 'admin',
    password: 'securePass!',
    latencyMs: 68,
    status: 'alive',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    lastTested: Date.now() - 60000
  },
  {
    id: 'prx_3',
    type: 'socks5',
    host: '194.36.89.2',
    port: 1080,
    username: '',
    password: '',
    latencyMs: 285,
    status: 'alive',
    country: 'Netherlands',
    countryCode: 'NL',
    flag: '🇳🇱',
    lastTested: Date.now() - 300000
  },
  {
    id: 'prx_4',
    type: 'http',
    host: '45.155.68.10',
    port: 3128,
    username: '',
    password: '',
    latencyMs: 820,
    status: 'alive',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    lastTested: Date.now() - 500000
  },
  {
    id: 'prx_5',
    type: 'socks5',
    host: '103.152.18.199',
    port: 1080,
    username: '',
    password: '',
    latencyMs: null,
    status: 'dead',
    country: 'Unknown',
    countryCode: '',
    flag: '🌐',
    lastTested: Date.now() - 600000,
    error: 'Connection timed out (Timeout)'
  },
  {
    id: 'prx_6',
    type: 'http',
    host: '139.59.241.11',
    port: 8080,
    username: '',
    password: '',
    latencyMs: null,
    status: 'untested',
    country: '',
    countryCode: '',
    flag: '🌐',
    lastTested: null
  }
];

const mockProfiles = [
  {
    id: 'p1',
    name: 'Instagram VIP Operations',
    color: '#4f8cff',
    startupUrl: 'https://instagram.com/direct',
    saveData: true,
    tags: ['Instagram', 'Crypto', 'US-Proxy'],
    notes: 'Recovery email: backup@gmail.com',
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
      host: '185.220.101.5',
      port: 1080,
      username: 'vip_user',
      password: 'secretPassword123'
    }
  }
];

// Register IPC handlers
ipcMain.handle('profiles:list', () => mockProfiles);
ipcMain.handle('status:running', () => ({ running: ['p1'], counts: { p1: 1 } }));
ipcMain.handle('status:chromium', () => ({ found: true, path: 'chrome.exe', name: 'jozmoz' }));
ipcMain.handle('status:dataFolder', () => 'C:\\UserData');

ipcMain.handle('proxies:list', () => mockProxies);
ipcMain.handle('proxies:save', (e, list) => {
  mockProxies = list;
  return true;
});
ipcMain.handle('proxies:test', async (e, p) => {
  // Return realistic mock response based on host
  if (p.host.includes('103.152')) {
    return { ok: false, error: 'Connection refused' };
  }
  return {
    ok: true,
    latencyMs: Math.floor(45 + Math.random() * 200),
    type: p.type,
    ip: p.host,
    country: 'Finland',
    countryCode: 'FI',
    flag: '🇫🇮'
  };
});
ipcMain.handle('proxy:test', async (e, p) => {
  return {
    ok: true,
    latencyMs: 74,
    type: p.type,
    ip: p.host,
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸'
  };
});

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

  // 1. Open Proxy Manager Modal
  await win.webContents.executeJavaScript(`
    document.getElementById('btnHeaderProxies').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const snapList = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'proxy_manager_list.png'), snapList.toPNG());
  console.log('Saved proxy_manager_list.png');

  // 2. Open Bulk Import Section and paste text
  await win.webContents.executeJavaScript(`
    document.getElementById('btnToggleBulkImport').click();
    document.getElementById('proxyBulkInput').value = 
      "http://185.220.101.5:8080:user1:pass123\\n" +
      "socks5://194.36.89.2:1080\\n" +
      "142.93.12.88:8080:admin:secret\\n" +
      "45.155.68.10:3128";
  `);
  await new Promise(r => setTimeout(r, 400));

  const snapBulk = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'proxy_manager_bulk.png'), snapBulk.toPNG());
  console.log('Saved proxy_manager_bulk.png');

  // 3. Sort by Ping
  await win.webContents.executeJavaScript(`
    document.getElementById('btnCancelBulkImport').click();
    document.getElementById('btnSortProxiesByPing').click();
  `);
  await new Promise(r => setTimeout(r, 500));

  const snapSorted = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'proxy_manager_sorted.png'), snapSorted.toPNG());
  console.log('Saved proxy_manager_sorted.png');

  // 4. Close Proxy Manager, Open Profile Modal -> Tab 3 (Proxy Tunnel)
  await win.webContents.executeJavaScript(`
    document.getElementById('proxyManagerClose').click();
    setTimeout(() => {
      document.getElementById('btnHeaderNew').click();
      setTimeout(() => {
        document.querySelector('.modal-tab-btn[data-tab="tabProxy"]').click();
        document.getElementById('proxyEnabled').checked = true;
        document.getElementById('proxyFieldsWrap').hidden = false;
      }, 400);
    }, 300);
  `);
  await new Promise(r => setTimeout(r, 1200));

  // Select a proxy from dropdown and trigger change
  await win.webContents.executeJavaScript(`
    var picker = document.getElementById('profileProxyPicker');
    if (picker && picker.options.length > 1) {
      picker.selectedIndex = 1;
      picker.dispatchEvent(new Event('change'));
    }
  `);
  await new Promise(r => setTimeout(r, 500));

  const snapPicker = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'profile_proxy_picker.png'), snapPicker.toPNG());
  console.log('Saved profile_proxy_picker.png');

  // 5. Test Persian RTL Proxy Manager
  await win.webContents.executeJavaScript(`
    document.getElementById('profileModalClose').click();
    document.getElementById('btnLangToggle').click();
    setTimeout(() => {
      document.getElementById('btnHeaderProxies').click();
    }, 400);
  `);
  await new Promise(r => setTimeout(r, 1000));

  const snapRtl = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'proxy_manager_rtl.png'), snapRtl.toPNG());
  console.log('Saved proxy_manager_rtl.png');

  win.close();
  app.quit();
});
