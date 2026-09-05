const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn, execFile, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const os = require('os');
const path = require('path');

const APP_NAME = 'Private Browser Pro';

function resolveDataDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  }
  const isPackaged = (app && app.isPackaged) || __dirname.includes('.asar');
  if (isPackaged) {
    try {
      if (app && typeof app.getPath === 'function') {
        return app.getPath('userData');
      }
    } catch (_) {}
    return path.join(os.homedir(), 'AppData', 'Roaming', 'Private Browser Pro');
  }
  return path.join(__dirname, 'data');
}

let DATA_DIR = resolveDataDir();
let PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
let SESSIONS_DIR = path.join(DATA_DIR, '.sessions');
let LEGACY_PROFILES_DIR = path.join(DATA_DIR, 'profiles');
let PROFILES_STORAGE_DIR = path.join(DATA_DIR, 'profiles_storage');
let CHROMIUM_DIR = path.join(DATA_DIR, 'chromium');
let CHROMIUM_EXE = path.join(CHROMIUM_DIR, 'chrome.exe');
let CHROMIUM_VERSION_FILE = path.join(CHROMIUM_DIR, 'version.txt');
let STEALTH_CACHE_DIR = path.join(DATA_DIR, '.stealth-cache');

function refreshPaths() {
  DATA_DIR = resolveDataDir();
  PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
  SESSIONS_DIR = path.join(DATA_DIR, '.sessions');
  LEGACY_PROFILES_DIR = path.join(DATA_DIR, 'profiles');
  PROFILES_STORAGE_DIR = path.join(DATA_DIR, 'profiles_storage');
  CHROMIUM_DIR = path.join(DATA_DIR, 'chromium');
  CHROMIUM_EXE = path.join(CHROMIUM_DIR, 'chrome.exe');
  CHROMIUM_VERSION_FILE = path.join(CHROMIUM_DIR, 'version.txt');
  STEALTH_CACHE_DIR = path.join(DATA_DIR, '.stealth-cache');
}

function ensureDataDir() {
  refreshPaths();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  if (!fs.existsSync(PROFILES_STORAGE_DIR)) fs.mkdirSync(PROFILES_STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(STEALTH_CACHE_DIR)) fs.mkdirSync(STEALTH_CACHE_DIR, { recursive: true });
}

/* ==================== Anti-Detect Presets & Fingerprint Engine ==================== */

const GPU_PRESETS = [
  // NVIDIA GeForce
  {
    id: 'nvidia-rtx4090',
    name: 'NVIDIA GeForce RTX 4090',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx4080',
    name: 'NVIDIA GeForce RTX 4080',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx4070',
    name: 'NVIDIA GeForce RTX 4070',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx4060ti',
    name: 'NVIDIA GeForce RTX 4060 Ti',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx3080',
    name: 'NVIDIA GeForce RTX 3080',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx3070',
    name: 'NVIDIA GeForce RTX 3070',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx3060',
    name: 'NVIDIA GeForce RTX 3060',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-rtx3050-lap',
    name: 'NVIDIA GeForce RTX 3050 Laptop GPU',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'nvidia-gtx1660s',
    name: 'NVIDIA GeForce GTX 1660 SUPER',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  // AMD Radeon
  {
    id: 'amd-rx7900xtx',
    name: 'AMD Radeon RX 7900 XTX',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'amd-rx7800',
    name: 'AMD Radeon RX 7800 XT',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'amd-rx6700xt',
    name: 'AMD Radeon RX 6700 XT',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'amd-rx6600',
    name: 'AMD Radeon RX 6600',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  // Intel
  {
    id: 'intel-arc-a770',
    name: 'Intel(R) Arc(TM) A770 Graphics',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'intel-arc-a750',
    name: 'Intel(R) Arc(TM) A750 Graphics',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) Arc(TM) A750 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'intel-iris-xe',
    name: 'Intel(R) Iris(R) Xe Graphics',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A8) Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    id: 'intel-uhd-770',
    name: 'Intel(R) UHD Graphics 770',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  // Apple Silicon
  {
    id: 'apple-m3-max',
    name: 'Apple M3 Max',
    vendor: 'Apple Inc.',
    renderer: 'ANGLE (Apple, Apple M3 Max, OpenGL 4.1)'
  },
  {
    id: 'apple-m3',
    name: 'Apple M3 Pro',
    vendor: 'Apple Inc.',
    renderer: 'ANGLE (Apple, Apple M3 Pro, OpenGL 4.1)'
  },
  {
    id: 'apple-m2-pro',
    name: 'Apple M2 Pro',
    vendor: 'Apple Inc.',
    renderer: 'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)'
  },
  {
    id: 'apple-m1',
    name: 'Apple M1',
    vendor: 'Apple Inc.',
    renderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)'
  }
];

const RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
  { width: 1366, height: 768 }
];

function getTimezoneOffsetFor(tz, date = new Date()) {
  try {
    if (!tz || tz === 'system') return new Date().getTimezoneOffset();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return Math.round((utcDate.getTime() - tzDate.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function getTimezoneName(tz, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long'
    }).formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : tz;
  } catch {
    return tz;
  }
}

function generateSmartFingerprint(custom = {}) {
  const osList = ['windows', 'windows', 'windows', 'mac', 'linux'];
  const os = custom.os || osList[Math.floor(Math.random() * osList.length)];

  let platform = 'Win32';
  let userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${UA_CHROME_VERSION} Safari/537.36`;

  const appleGpus = GPU_PRESETS.filter(g => g.vendor === 'Apple Inc.');
  const pcGpus = GPU_PRESETS.filter(g => g.vendor !== 'Apple Inc.');
  let gpu = pcGpus[0];

  if (os === 'mac') {
    platform = 'MacIntel';
    userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${UA_CHROME_VERSION} Safari/537.36`;
    gpu = appleGpus[Math.floor(Math.random() * appleGpus.length)];
  } else if (os === 'linux') {
    platform = 'Linux x86_64';
    userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${UA_CHROME_VERSION} Safari/537.36`;
    const linuxFriendly = GPU_PRESETS.filter(g => g.id === 'intel-iris-xe' || g.id === 'amd-rx7800' || g.id === 'nvidia-rtx3060');
    gpu = linuxFriendly[Math.floor(Math.random() * linuxFriendly.length)] || pcGpus[0];
  } else {
    gpu = pcGpus[Math.floor(Math.random() * pcGpus.length)];
  }

  const res = RESOLUTIONS[Math.floor(Math.random() * RESOLUTIONS.length)];
  const coresList = [4, 6, 8, 12, 16];
  const memList = [4, 8, 16, 32];
  const cores = coresList[Math.floor(Math.random() * coresList.length)];
  const mem = memList[Math.floor(Math.random() * memList.length)];
  const seed = Math.floor(Math.random() * 900000) + 100000;

  const tz = custom.timezone || 'America/New_York';
  const tzOffset = getTimezoneOffsetFor(tz);
  const lang = custom.language || 'en-US';

  return {
    os,
    platform: custom.platform || platform,
    userAgent: custom.userAgent || userAgent,
    hardwareConcurrency: custom.hardwareConcurrency || cores,
    deviceMemory: custom.deviceMemory || mem,
    screenWidth: custom.screenWidth || res.width,
    screenHeight: custom.screenHeight || res.height,
    webglVendor: custom.webglVendor || gpu.vendor,
    webglRenderer: custom.webglRenderer || gpu.renderer,
    webglGpuName: custom.webglGpuName || gpu.name,
    canvasNoise: custom.canvasNoise !== false,
    audioNoise: custom.audioNoise !== false,
    webglNoise: custom.webglNoise !== false,
    captchaSafe: custom.captchaSafe !== false,
    webrtcPolicy: custom.webrtcPolicy || 'disable_non_proxied_udp',
    timezone: tz,
    timezoneOffset: tzOffset,
    language: lang,
    seed
  };
}

function cleanFingerprint(raw) {
  if (!raw || typeof raw !== 'object') return generateSmartFingerprint();
  const def = generateSmartFingerprint(raw);
  const rawTz = String(raw.timezone || def.timezone).slice(0, 50);
  const tzOffset = getTimezoneOffsetFor(rawTz);
  return {
    os: ['windows', 'mac', 'linux'].includes(raw.os) ? raw.os : def.os,
    platform: String(raw.platform || def.platform).slice(0, 30),
    userAgent: String(raw.userAgent || def.userAgent).slice(0, 300),
    hardwareConcurrency: (Number(raw.hardwareConcurrency) > 0) ? Number(raw.hardwareConcurrency) : def.hardwareConcurrency,
    deviceMemory: (Number(raw.deviceMemory) > 0) ? Number(raw.deviceMemory) : def.deviceMemory,
    screenWidth: parseInt(raw.screenWidth, 10) || def.screenWidth,
    screenHeight: parseInt(raw.screenHeight, 10) || def.screenHeight,
    webglVendor: String(raw.webglVendor || def.webglVendor).slice(0, 100),
    webglRenderer: String(raw.webglRenderer || def.webglRenderer).slice(0, 150),
    webglGpuName: String(raw.webglGpuName || def.webglGpuName).slice(0, 60),
    canvasNoise: raw.canvasNoise !== false,
    audioNoise: raw.audioNoise !== false,
    webglNoise: raw.webglNoise !== false,
    captchaSafe: raw.captchaSafe !== false,
    webrtcPolicy: ['disable', 'disable_non_proxied_udp', 'default'].includes(raw.webrtcPolicy) ? raw.webrtcPolicy : 'disable_non_proxied_udp',
    timezone: rawTz,
    timezoneOffset: tzOffset,
    language: String(raw.language || def.language).slice(0, 20),
    seed: Number(raw.seed) || def.seed
  };
}

function buildStealthScript(fp) {
  const resolvedTz = (fp.timezone && fp.timezone !== 'system') ? fp.timezone : 'Europe/Istanbul';
  const tzOffset = (typeof fp.timezoneOffset === 'number') ? fp.timezoneOffset : getTimezoneOffsetFor(resolvedTz);
  const tzName = getTimezoneName(resolvedTz);

  let languages = ['en-US', 'en'];
  if (fp.language) {
    if (fp.language.startsWith('tr')) languages = ['tr-TR', 'tr', 'en-US', 'en'];
    else if (fp.language.startsWith('fa')) languages = ['fa-IR', 'fa', 'en-US', 'en'];
    else if (fp.language.startsWith('de')) languages = ['de-DE', 'de', 'en-US', 'en'];
    else if (fp.language.startsWith('fr')) languages = ['fr-FR', 'fr', 'en-US', 'en'];
    else if (fp.language.startsWith('ru')) languages = ['ru-RU', 'ru', 'en-US', 'en'];
    else if (fp.language.startsWith('ar')) languages = ['ar-AE', 'ar', 'en-US', 'en'];
  }

  let chromeMajor = '130';
  let chromeFull = '130.0.6723.117';
  const uaMatch = (fp.userAgent || '').match(/Chrome\/(\d+)(\.[\d.]+)/);
  if (uaMatch) {
    chromeMajor = uaMatch[1];
    chromeFull = uaMatch[1] + uaMatch[2];
  }

  const jsonConfig = JSON.stringify({
    chromeMajor: chromeMajor,
    chromeFull: chromeFull,
    hardwareConcurrency: fp.hardwareConcurrency || 8,
    deviceMemory: fp.deviceMemory || 8,
    platform: fp.platform || 'Win32',
    userAgent: fp.userAgent || '',
    languages: languages,
    screenWidth: fp.screenWidth || 1920,
    screenHeight: fp.screenHeight || 1080,
    canvasNoise: fp.canvasNoise !== false,
    audioNoise: fp.audioNoise !== false,
    webglNoise: fp.webglNoise !== false,
    captchaSafe: fp.captchaSafe !== false,
    webglVendor: fp.webglVendor || 'Google Inc. (NVIDIA)',
    webglRenderer: fp.webglRenderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webrtcPolicy: fp.webrtcPolicy || 'disable_non_proxied_udp',
    timezone: resolvedTz,
    timezoneOffset: tzOffset,
    timezoneName: tzName,
    seed: fp.seed || 12345
  });

  return `// Privacy Shield Core - Verified Anti-Detect Engine
(function() {
  const cfg = ${jsonConfig};

  // 1. Native Function Masking (Pure [native code] with prototype & length fidelity)
  const nativeToString = Function.prototype.toString;
  const hookedFns = new WeakMap();
  function makeNative(fn, name, len = 0) {
    hookedFns.set(fn, name || fn.name || '');
    try { delete fn.prototype; } catch(e) {}
    try {
      Object.defineProperty(fn, 'name', { value: name, configurable: true });
      Object.defineProperty(fn, 'length', { value: len, configurable: true });
    } catch(e) {}
    return fn;
  }

  Function.prototype.toString = function() {
    if (hookedFns.has(this)) {
      const n = hookedFns.get(this);
      return 'function ' + n + '() { [native code] }';
    }
    return nativeToString.call(this);
  };
  makeNative(Function.prototype.toString, 'toString', 0);

  // 2. Client Hints (navigator.userAgentData) - Always match target OS platform & UA version
  try {
    if (navigator.userAgentData || window.NavigatorUAData) {
      const isMac = cfg.platform === 'MacIntel';
      const isLinux = cfg.platform === 'Linux x86_64';
      const osPlatform = isMac ? 'macOS' : (isLinux ? 'Linux' : 'Windows');
      const osVersion = isMac ? '15.0.0' : (isLinux ? '6.8.0' : '15.0.0');
      const chromeVer = cfg.chromeMajor || '130';
      const chromeFullVer = cfg.chromeFull || (chromeVer + '.0.0.0');
      const brands = [
        { brand: 'Chromium', version: chromeVer },
        { brand: 'Google Chrome', version: chromeVer },
        { brand: 'Not_A Brand', version: '24' }
      ];

      const uad = {
        brands: brands,
        mobile: false,
        platform: osPlatform,
        getHighEntropyValues: makeNative(function getHighEntropyValues(hints) {
          return Promise.resolve({
            architecture: 'x86',
            bitness: '64',
            brands: brands,
            fullVersionList: brands.map(b => ({ brand: b.brand, version: b.brand === 'Not_A Brand' ? '24.0.0.0' : chromeFullVer })),
            mobile: false,
            model: '',
            platform: osPlatform,
            platformVersion: osVersion,
            uaFullVersion: chromeFullVer
          });
        }, 'getHighEntropyValues', 1),
        toJSON: makeNative(function toJSON() {
          return { brands, mobile: false, platform: osPlatform };
        }, 'toJSON', 0)
      };

      try { delete navigator.userAgentData; } catch(e) {}
      Object.defineProperty(Navigator.prototype, 'userAgentData', {
        get: makeNative(function userAgentData() {
          if (!this || (!(this instanceof Navigator) && this !== window.navigator)) return undefined;
          return uad;
        }, 'get userAgentData', 0),
        configurable: true,
        enumerable: true
      });
      try {
        Object.defineProperty(navigator, 'userAgentData', {
          get: makeNative(function userAgentData() { return uad; }, 'get userAgentData', 0),
          configurable: true,
          enumerable: true
        });
      } catch(e) {}
    }
  } catch(e) {}

  // 3. Hardware & Screen Fingerprint (Safe Prototype Descriptors)
  try {
    const cores = Number(cfg.hardwareConcurrency) || 8;
    const mem = Number(cfg.deviceMemory) || 8;
    const targetPlatform = cfg.platform || 'Win32';
    const targetNav = (typeof Navigator !== 'undefined' && Navigator.prototype) ? Navigator.prototype : navigator;

    try { delete navigator.hardwareConcurrency; } catch(e) {}
    try { delete navigator.deviceMemory; } catch(e) {}
    try { delete navigator.platform; } catch(e) {}
    try { delete navigator.doNotTrack; } catch(e) {}

    Object.defineProperty(targetNav, 'hardwareConcurrency', {
      get: makeNative(function hardwareConcurrency() {
        if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
          throw new TypeError("Failed to read the 'hardwareConcurrency' property from 'Navigator': Illegal invocation");
        }
        return cores;
      }, 'get hardwareConcurrency', 0),
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(targetNav, 'deviceMemory', {
      get: makeNative(function deviceMemory() {
        if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
          throw new TypeError("Failed to read the 'deviceMemory' property from 'Navigator': Illegal invocation");
        }
        return mem;
      }, 'get deviceMemory', 0),
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(targetNav, 'platform', {
      get: makeNative(function platform() {
        if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
          throw new TypeError("Failed to read the 'platform' property from 'Navigator': Illegal invocation");
        }
        return targetPlatform;
      }, 'get platform', 0),
      configurable: true,
      enumerable: true
    });

    if (cfg.userAgent && cfg.userAgent !== navigator.userAgent) {
      Object.defineProperty(targetNav, 'userAgent', {
        get: makeNative(function userAgent() {
          if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
            throw new TypeError("Failed to read the 'userAgent' property from 'Navigator': Illegal invocation");
          }
          return cfg.userAgent;
        }, 'get userAgent', 0),
        configurable: true,
        enumerable: true
      });
      Object.defineProperty(targetNav, 'appVersion', {
        get: makeNative(function appVersion() {
          if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
            throw new TypeError("Failed to read the 'appVersion' property from 'Navigator': Illegal invocation");
          }
          return cfg.userAgent.replace(/^Mozilla\\//, '');
        }, 'get appVersion', 0),
        configurable: true,
        enumerable: true
      });
    }

    if (cfg.languages && cfg.languages.length) {
      Object.defineProperty(targetNav, 'languages', {
        get: makeNative(function languages() {
          if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
            throw new TypeError("Failed to read the 'languages' property from 'Navigator': Illegal invocation");
          }
          return cfg.languages;
        }, 'get languages', 0),
        configurable: true,
        enumerable: true
      });
      Object.defineProperty(targetNav, 'language', {
        get: makeNative(function language() {
          if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
            throw new TypeError("Failed to read the 'language' property from 'Navigator': Illegal invocation");
          }
          return cfg.languages[0];
        }, 'get language', 0),
        configurable: true,
        enumerable: true
      });
    }

    // Do Not Track (Signals privacy without breaking web standards)
    Object.defineProperty(targetNav, 'doNotTrack', {
      get: makeNative(function doNotTrack() { return '1'; }, 'get doNotTrack', 0),
      configurable: true,
      enumerable: true
    });
    try { window.doNotTrack = '1'; } catch(e) {}

    // Navigator.webdriver Masking (Crucial for eliminating Test / Automation flags)
    try {
      delete Object.getPrototypeOf(navigator).webdriver;
    } catch(e) {}
    try {
      delete navigator.webdriver;
    } catch(e) {}
    try {
      Object.defineProperty(targetNav, 'webdriver', {
        get: makeNative(function webdriver() {
          if (!this || (!(this instanceof (typeof Navigator !== 'undefined' ? Navigator : Object)) && this !== window.navigator)) {
            throw new TypeError("Failed to read the 'webdriver' property from 'Navigator': Illegal invocation");
          }
          return undefined;
        }, 'get webdriver', 0),
        configurable: true,
        enumerable: true
      });
    } catch(e) {}
  } catch(e) {}

  // Screen Dimensions on both Screen.prototype and window.screen
  try {
    const sw = Number(cfg.screenWidth) || 1920;
    const sh = Number(cfg.screenHeight) || 1080;

    const screenProps = {
      width: { get: makeNative(function width() { return sw; }, 'get width', 0), configurable: true, enumerable: true },
      height: { get: makeNative(function height() { return sh; }, 'get height', 0), configurable: true, enumerable: true },
      availWidth: { get: makeNative(function availWidth() { return sw; }, 'get availWidth', 0), configurable: true, enumerable: true },
      availHeight: { get: makeNative(function availHeight() { return sh - 40; }, 'get availHeight', 0), configurable: true, enumerable: true },
      colorDepth: { get: makeNative(function colorDepth() { return 24; }, 'get colorDepth', 0), configurable: true, enumerable: true },
      pixelDepth: { get: makeNative(function pixelDepth() { return 24; }, 'get pixelDepth', 0), configurable: true, enumerable: true }
    };

    if (typeof Screen !== 'undefined' && Screen.prototype) {
      Object.defineProperties(Screen.prototype, screenProps);
    }
    if (typeof window !== 'undefined' && window.screen) {
      Object.defineProperties(window.screen, screenProps);
    }
  } catch(e) {}

  // WebGL Vendor & Renderer Spoofing
  try {
    if (cfg.webglVendor || cfg.webglRenderer) {
      const targetVendor = cfg.webglVendor || 'Google Inc. (NVIDIA)';
      const targetRenderer = cfg.webglRenderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)';

      function hookWebGL(proto) {
        if (!proto || !proto.getParameter) return;
        const origGetParam = proto.getParameter;
        proto.getParameter = makeNative(function getParameter(param) {
          if (!this || (!(this instanceof (typeof WebGLRenderingContext !== 'undefined' ? WebGLRenderingContext : Object)) && !(this instanceof (typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext : Object)))) {
            throw new TypeError("Failed to execute 'getParameter' on 'WebGLRenderingContext': Illegal invocation");
          }
          if (param === 37445) return targetVendor;
          if (param === 37446) return targetRenderer;
          return origGetParam.call(this, param);
        }, 'getParameter', 1);
      }
      if (typeof WebGLRenderingContext !== 'undefined') hookWebGL(WebGLRenderingContext.prototype);
      if (typeof WebGL2RenderingContext !== 'undefined') hookWebGL(WebGL2RenderingContext.prototype);
    }
  } catch(e) {}

  // 4. Timezone Emulation with Strict Receiver Validation
  try {
    if (cfg.timezone) {
      const targetTz = cfg.timezone;
      const targetOffset = typeof cfg.timezoneOffset === 'number' ? cfg.timezoneOffset : 0;
      const tzLongName = cfg.timezoneName || 'Türkiye Standard Time';

      const origGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = makeNative(function getTimezoneOffset() {
        origGetTimezoneOffset.call(this); // Throws native TypeError if receiver not a Date!
        return targetOffset;
      }, 'getTimezoneOffset', 0);

      const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      Intl.DateTimeFormat.prototype.resolvedOptions = makeNative(function resolvedOptions() {
        const opts = origResolvedOptions.call(this); // Throws native TypeError if receiver not valid!
        opts.timeZone = targetTz;
        return opts;
      }, 'resolvedOptions', 0);

      const OrigDTF = Intl.DateTimeFormat;
      const CustomDTF = function(...args) {
        const locales = args[0];
        const options = Object.assign({}, args[1]);
        if (!options.timeZone) options.timeZone = targetTz;
        if (new.target) return new OrigDTF(locales, options);
        return OrigDTF(locales, options);
      };
      CustomDTF.prototype = OrigDTF.prototype;
      CustomDTF.supportedLocalesOf = OrigDTF.supportedLocalesOf;
      makeNative(CustomDTF, 'DateTimeFormat', 0);
      Intl.DateTimeFormat = CustomDTF;

      const sign = targetOffset <= 0 ? '+' : '-';
      const absOffset = Math.abs(targetOffset);
      const offH = String(Math.floor(absOffset / 60)).padStart(2, '0');
      const offM = String(absOffset % 60).padStart(2, '0');
      const gmtString = 'GMT' + sign + offH + offM + ' (' + tzLongName + ')';

      const origToTimeString = Date.prototype.toTimeString;
      Date.prototype.toTimeString = makeNative(function toTimeString() {
        origToTimeString.call(this); // Throws native TypeError if receiver not a Date!
        try {
          const timeParts = new OrigDTF('en-US', {
            timeZone: targetTz,
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          }).format(this);
          return timeParts + ' ' + gmtString;
        } catch(e) {
          return origToTimeString.call(this);
        }
      }, 'toTimeString', 0);

      const origToString = Date.prototype.toString;
      Date.prototype.toString = makeNative(function toString() {
        origToString.call(this); // Throws native TypeError if receiver not a Date!
        try {
          const dateParts = new OrigDTF('en-US', {
            timeZone: targetTz,
            weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
          }).format(this).replace(/,/g, '');
          return dateParts + ' ' + this.toTimeString();
        } catch(e) {
          return origToString.call(this);
        }
      }, 'toString', 0);
    }
  } catch(e) {}

  // 5. Plugins Check (Preserve authentic native PluginArray in Chromium)
  try {
    if (!navigator.plugins || navigator.plugins.length === 0) {
      function fakePlugin(name, filename, description, mimes) {
        const p = { name, filename, description, length: mimes.length };
        mimes.forEach((m, idx) => {
          p[idx] = m;
          p[m.type] = m;
        });
        return p;
      }
      const pdfMime = { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' };
      const textPdfMime = { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' };
      const p1 = fakePlugin('Chrome PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', [pdfMime, textPdfMime]);
      const p2 = fakePlugin('Chromium PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', [pdfMime]);
      const p3 = fakePlugin('WebKit built-in PDF', 'internal-pdf-viewer', 'Portable Document Format', [pdfMime]);
      const fakePluginsList = [p1, p2, p3];

      Object.defineProperty(navigator, 'plugins', {
        get: makeNative(function plugins() {
          const list = fakePluginsList.slice();
          list.item = (i) => list[i] || null;
          list.namedItem = (n) => list.find(p => p.name === n) || null;
          list.refresh = () => {};
          return list;
        }, 'get plugins', 0),
        configurable: true,
        enumerable: true
      });
    }
  } catch(e) {}

  // 6. WebRTC IP Leak Protection
  if (cfg.webrtcPolicy === 'disable') {
    try {
      window.RTCPeerConnection = undefined;
      window.webkitRTCPeerConnection = undefined;
      window.mozRTCPeerConnection = undefined;
    } catch(e) {}
  } else if (cfg.webrtcPolicy === 'disable_non_proxied_udp' && window.RTCPeerConnection) {
    try {
      const OrigPC = window.RTCPeerConnection;
      const CustomPC = function(...args) {
        const pc = new OrigPC(...args);
        const origAddEventListener = pc.addEventListener;
        pc.addEventListener = function(type, listener, ...rest) {
          if (type === 'icecandidate') {
            const wrapped = function(e) {
              if (e.candidate && e.candidate.candidate) {
                const cand = e.candidate.candidate;
                if (/192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|typ srflx|typ host/.test(cand)) {
                  return;
                }
              }
              listener.call(this, e);
            };
            return origAddEventListener.call(this, type, wrapped, ...rest);
          }
          return origAddEventListener.call(this, type, listener, ...rest);
        };
        return pc;
      };
      CustomPC.prototype = OrigPC.prototype;
      makeNative(CustomPC, 'RTCPeerConnection', 0);
      window.RTCPeerConnection = CustomPC;
    } catch(e) {}
  }

  // 7. Canvas, Audio, WebGL Fingerprint Protection (Captcha-Safe Guarantee)
  // When captchaSafe is true, we leave canvas, audio, and WebGL 100% native and untampered.
  // This guarantees Cloudflare Turnstile's cryptographic proof-of-work hashes match and pass without looping!
  if (!cfg.captchaSafe) {
    // Only apply noise if user explicitly disabled Captcha-Safe mode
    if (cfg.canvasNoise) {
      try {
        const shift = ((cfg.seed % 7) || 3);
        const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = makeNative(function getImageData(...args) {
          const imgData = origGetImageData.apply(this, args);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 188) {
            if (d[i + 3] > 0) d[i] = (d[i] + shift) % 256;
          }
          return imgData;
        }, 'getImageData', 4);
      } catch(e) {}
    }

    if (cfg.audioNoise && window.AudioBuffer) {
      try {
        const origGetChannelData = AudioBuffer.prototype.getChannelData;
        AudioBuffer.prototype.getChannelData = makeNative(function getChannelData(channel) {
          const data = origGetChannelData.call(this, channel);
          for (let i = 0; i < data.length; i += 200) {
            data[i] = data[i] + (Math.sin(i + (cfg.seed || 42)) * 1e-7);
          }
          return data;
        }, 'getChannelData', 1);
      } catch(e) {}
    }
  }

  // 8. Clean Chrome Runtime / App / LoadTimes (Match real Chrome identity)
  try {
    if (!window.chrome) window.chrome = {};
    if (!window.chrome.app) {
      window.chrome.app = {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
        getDetails: makeNative(function getDetails() { return null; }, 'getDetails', 0),
        getIsInstalled: makeNative(function getIsInstalled() { return false; }, 'getIsInstalled', 0),
        installState: makeNative(function installState() { return 'not_installed'; }, 'installState', 0),
        runningState: makeNative(function runningState() { return 'cannot_run'; }, 'runningState', 0)
      };
    }
    if (!window.chrome.csi) window.chrome.csi = makeNative(function csi() { return { startE: Date.now() }; }, 'csi', 0);
    if (!window.chrome.loadTimes) window.chrome.loadTimes = makeNative(function loadTimes() { return { requestTime: Date.now() / 1000 }; }, 'loadTimes', 0);
  } catch(e) {}
})();
`;
}

function loadProfiles() {
  ensureDataDir();
  try {
    const parsed = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    let updated = false;
    for (const p of parsed) {
      if (!p.fingerprint) {
        p.fingerprint = generateSmartFingerprint();
        updated = true;
      }
    }
    if (updated) saveProfiles(parsed);
    return parsed;
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      try {
        if (fs.existsSync(PROFILES_FILE)) {
          fs.copyFileSync(PROFILES_FILE, path.join(DATA_DIR, `profiles.corrupt-${Date.now()}.json`));
        }
      } catch {}
    }
    return [];
  }
}

function saveProfiles(profiles) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function cleanName(raw) {
  const n = String(raw || '').trim().slice(0, 60);
  return n || 'Untitled Profile';
}

function cleanColor(raw) {
  const c = String(raw || '').trim();
  return HEX_COLOR.test(c) ? c : '#4f8cff';
}

function cleanStartupUrl(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  const withProto = /^https?:\/\//i.test(u) ? u : 'https://' + u;
  try {
    const parsed = new URL(withProto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return withProto;
  } catch {
    return '';
  }
}

function cleanProxy(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const enabled = raw.enabled !== false;
  if (!enabled) return null;
  let host = String(raw.host || '').trim();
  if (!host) return null;
  host = host.replace(/^https?:\/\//i, '').replace(/^socks5?:\/\//i, '').split('/')[0].trim();
  if (!host || host.length > 255 || /\s/.test(host)) return null;
  if (!/^[A-Za-z0-9.\-_:[\]]+$/.test(host)) return null;
  const port = parseInt(String(raw.port || '').trim(), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  const type = (raw.type === 'socks5') ? 'socks5' : 'http';
  const username = String(raw.username || '').trim().slice(0, 100);
  const password = String(raw.password || '').trim().slice(0, 100);
  return { enabled: true, type, host, port, username, password };
}

function cleanTags(raw) {
  if (Array.isArray(raw)) {
    return raw.map(t => String(t).trim()).filter(Boolean).slice(0, 10);
  }
  if (typeof raw === 'string') {
    return raw.split(/[,،]/).map(t => t.trim()).filter(Boolean).slice(0, 10);
  }
  return [];
}

function cleanNotes(raw) {
  return String(raw || '').trim().slice(0, 2000);
}

/* Base Anti-Detection Flags */
const PRIVATE_FLAGS = [
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-sync',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-domain-reliability',
  '--disable-breakpad',
  '--disable-crash-reporter',
  '--disable-client-side-phishing-detection',
  '--disable-search-engine-choice-screen',
  '--disable-features=msImplicitSignIn,msAccountManagement,msTokenBroker,msSingleSignOn,msEdgePasswordManager,msEdgeFre,msSmartScreenProtection,msHubs,msPersonalizeWebExperience,Translate,OptimizationHints,MediaRouter,ChromeWhatsNewUI,AutofillServerCommunication,InterestFeedContentSuggestions,WebRtcHideLocalIpsWithMdns',
  '--edge-skip-first-run-experience',
  '--disable-account-consistency',
  '--disable-signin-scoped-device-id',
  '--disable-gcm',
  '--disable-default-apps',
  '--disable-extensions-file-access-check',
  '--metrics-recording-only',
  '--noerrdialogs',
  '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
  '--enforce-webrtc-ip-permission-check',
  '--disable-dns-prefetch',
  '--dns-prefetch-disable',
  '--password-store=basic',
  '--disable-session-crashed-bubble'
];

function findChromiumBinary() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    CHROMIUM_EXE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    localAppData ? path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe') : null,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c;
    } catch {}
  }
  return null;
}

const running = new Map();
let mainWindow = null;

function runningSnapshot() {
  const counts = {};
  for (const rec of running.values()) {
    counts[rec.profileId] = (counts[rec.profileId] || 0) + 1;
  }
  return { running: Object.keys(counts), counts };
}

function broadcastRunning() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('browser:status', runningSnapshot());
    } catch {}
  }
}

function safeRmSessionDir(dir) {
  try {
    if (dir && (dir.startsWith(SESSIONS_DIR) || dir.startsWith(PROFILES_STORAGE_DIR)) && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    }
  } catch {}
}

async function safeRmSessionDirAsync(dir, retries = 5, delay = 500) {
  if (!dir || (!dir.startsWith(SESSIONS_DIR) && !dir.startsWith(PROFILES_STORAGE_DIR))) return;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
      }
      if (!fs.existsSync(dir)) return;
    } catch {}
    await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
  }
}

/* ==================== Local Proxy Bridge (SOCKS5 & HTTP with Auth) ==================== */

/**
 * Creates a local HTTP proxy bridge that transparently tunnels browser traffic
 * to the user's SOCKS5 or HTTP proxy. Handles RFC 1928/1929 username/password auth,
 * executes remote DNS resolution on the proxy (anti-DNS leak), and prevents browser auth prompts.
 */
function createProxyBridge(upstream) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (upstream.type === 'socks5') {
        handleBridgeSocks5Http(req, res, upstream);
      } else {
        handleBridgeHttpDirect(req, res, upstream);
      }
    });

    server.on('connect', (req, clientSocket, head) => {
      if (upstream.type === 'socks5') {
        handleBridgeSocks5Connect(req, clientSocket, head, upstream);
      } else {
        handleBridgeHttpConnect(req, clientSocket, head, upstream);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        port,
        close: () => {
          try { server.close(); } catch {}
        }
      });
    });

    server.on('error', reject);
  });
}

function connectBridgeSocks5Tunnel(upstream, targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(upstream.port, upstream.host, () => {
      const hasAuth = !!(upstream.username && upstream.password);
      socket.write(hasAuth ? Buffer.from([0x05, 0x01, 0x02]) : Buffer.from([0x05, 0x01, 0x00]));
    });

    socket.setTimeout(15000);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('SOCKS5 connection timeout'));
    });

    let stage = 'greeting';

    socket.on('data', function onData(chunk) {
      try {
        if (stage === 'greeting') {
          if (chunk[0] !== 0x05) {
            socket.destroy();
            return reject(new Error('Invalid SOCKS5 version from upstream'));
          }
          if (chunk[1] === 0x02) {
            stage = 'auth';
            const u = Buffer.from(upstream.username || '', 'utf8');
            const p = Buffer.from(upstream.password || '', 'utf8');
            const authBuf = Buffer.concat([
              Buffer.from([0x01, u.length]),
              u,
              Buffer.from([p.length]),
              p
            ]);
            socket.write(authBuf);
            return;
          }
          if (chunk[1] === 0xFF) {
            socket.destroy();
            return reject(new Error('SOCKS5 proxy rejected authentication'));
          }
          stage = 'connect';
          sendBridgeSocks5Connect(socket, targetHost, targetPort);
        } else if (stage === 'auth') {
          if (chunk[1] !== 0x00) {
            socket.destroy();
            return reject(new Error('SOCKS5 username/password rejected'));
          }
          stage = 'connect';
          sendBridgeSocks5Connect(socket, targetHost, targetPort);
        } else if (stage === 'connect') {
          if (chunk[1] !== 0x00) {
            socket.destroy();
            return reject(new Error('SOCKS5 connect error: ' + chunk[1]));
          }
          socket.removeListener('data', onData);
          resolve(socket);
        }
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    });

    socket.on('error', reject);
  });
}

function sendBridgeSocks5Connect(socket, host, port) {
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (isIpv4) {
    const parts = host.split('.').map(Number);
    socket.write(Buffer.concat([
      Buffer.from([0x05, 0x01, 0x00, 0x01, ...parts]),
      Buffer.from([(port >> 8) & 0xff, port & 0xff])
    ]));
  } else {
    const hostBuf = Buffer.from(host, 'utf8');
    socket.write(Buffer.concat([
      Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuf.length]),
      hostBuf,
      Buffer.from([(port >> 8) & 0xff, port & 0xff])
    ]));
  }
}

function handleBridgeSocks5Connect(req, clientSocket, head, upstream) {
  let targetHost = req.url;
  let targetPort = 443;
  const lastColon = req.url.lastIndexOf(':');
  if (lastColon !== -1) {
    targetHost = req.url.slice(0, lastColon).replace(/^\[|\]$/g, '');
    targetPort = parseInt(req.url.slice(lastColon + 1), 10) || 443;
  }

  connectBridgeSocks5Tunnel(upstream, targetHost, targetPort)
    .then((tunnelSocket) => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head && head.length) tunnelSocket.write(head);
      tunnelSocket.pipe(clientSocket);
      clientSocket.pipe(tunnelSocket);
      tunnelSocket.on('error', () => clientSocket.destroy());
      clientSocket.on('error', () => tunnelSocket.destroy());
    })
    .catch(() => {
      clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      clientSocket.end();
    });
}

function handleBridgeSocks5Http(req, res, upstream) {
  try {
    const parsed = new URL(req.url);
    const targetHost = parsed.hostname;
    const targetPort = parseInt(parsed.port, 10) || 80;

    connectBridgeSocks5Tunnel(upstream, targetHost, targetPort)
      .then((tunnelSocket) => {
        tunnelSocket.write(`${req.method} ${parsed.pathname}${parsed.search} HTTP/1.1\r\n`);
        for (const h in req.headers) {
          if (!/^proxy-/i.test(h)) {
            tunnelSocket.write(`${h}: ${req.headers[h]}\r\n`);
          }
        }
        tunnelSocket.write('\r\n');
        req.pipe(tunnelSocket);
        tunnelSocket.pipe(res);
        tunnelSocket.on('error', () => res.destroy());
      })
      .catch(() => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway');
      });
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
  }
}

function handleBridgeHttpConnect(req, clientSocket, head, upstream) {
  const upstreamSocket = net.connect(upstream.port, upstream.host, () => {
    let connectReq = `CONNECT ${req.url} HTTP/1.1\r\nHost: ${req.url}\r\n`;
    if (upstream.username && upstream.password) {
      const auth = Buffer.from(`${upstream.username}:${upstream.password}`).toString('base64');
      connectReq += `Proxy-Authorization: Basic ${auth}\r\n`;
    }
    connectReq += 'Proxy-Connection: Keep-Alive\r\n\r\n';
    upstreamSocket.write(connectReq);
  });

  upstreamSocket.setTimeout(15000);
  upstreamSocket.on('timeout', () => {
    try { upstreamSocket.destroy(); } catch (_) {}
    try { clientSocket.destroy(); } catch (_) {}
  });

  upstreamSocket.once('data', (chunk) => {
    const statusLine = chunk.toString('utf8');
    if (statusLine.includes('200')) {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head && head.length) upstreamSocket.write(head);
      upstreamSocket.pipe(clientSocket);
      clientSocket.pipe(upstreamSocket);
    } else {
      clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      clientSocket.end();
      upstreamSocket.destroy();
    }
  });

  upstreamSocket.on('error', () => clientSocket.destroy());
  clientSocket.on('error', () => upstreamSocket.destroy());
}

function handleBridgeHttpDirect(req, res, upstream) {
  const headers = Object.assign({}, req.headers);
  if (upstream.username && upstream.password) {
    headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${upstream.username}:${upstream.password}`).toString('base64');
  }

  const opt = {
    host: upstream.host,
    port: upstream.port,
    path: req.url,
    method: req.method,
    headers: headers,
    timeout: 15000
  };

  const proxyReq = http.request(opt, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('timeout', () => {
    try { proxyReq.destroy(); } catch (_) {}
    try {
      res.writeHead(504, { 'Content-Type': 'text/plain' });
      res.end('Gateway Timeout');
    } catch (_) {}
  });

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq);
}

function cleanupLaunch(token) {
  const rec = running.get(token);
  if (!rec) return;
  running.delete(token);
  if (rec.bridge && typeof rec.bridge.close === 'function') {
    try { rec.bridge.close(); } catch {}
  }
  broadcastRunning();
  if (rec.isEphemeral) {
    safeRmSessionDirAsync(rec.dir);
  }
}

async function launchProfile(profile) {
  const bin = findChromiumBinary();
  if (!bin) return { ok: false, error: 'NO_BROWSER' };

  const isPersistent = profile.saveData !== false;
  const token = crypto.randomUUID();
  const dir = isPersistent
    ? path.join(PROFILES_STORAGE_DIR, profile.id)
    : path.join(SESSIONS_DIR, `session-${profile.id}-${Date.now()}-${token.slice(0, 8)}`);

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }

  const fp = profile.fingerprint || generateSmartFingerprint();

  // Create isolated stealth extension inside the session folder
  const extDir = path.join(dir, 'stealth-ext');
  try {
    fs.mkdirSync(extDir, { recursive: true });

    // Copy application icon to extension folder
    const appIconCandidates = [
      path.join(__dirname, 'assets', 'icon.ico'),
      path.join(__dirname, 'build', 'icon.ico'),
      path.join(__dirname, 'jozmoz.ico'),
      path.join(__dirname, 'assets', 'icon.png')
    ];
    const appIconSrc = appIconCandidates.find(p => fs.existsSync(p));
    if (appIconSrc) {
      try { fs.copyFileSync(appIconSrc, path.join(extDir, 'icon.ico')); } catch (_) {}
    }

    const newtabHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${profile.name || 'Private Browser'} - Start Page</title>
  <link rel="icon" type="image/x-icon" href="icon.ico">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 15%, #1e293b 0%, #0b0f19 100%);
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      padding: 36px 20px;
    }
    .container {
      max-width: 760px;
      width: 100%;
      background: rgba(30, 41, 59, 0.75);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 18px;
      padding: 32px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.55);
      text-align: center;
    }
    .badge-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-mode {
      background: ${isPersistent ? 'rgba(74, 222, 128, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
      color: ${isPersistent ? '#4ade80' : '#fbbf24'};
      border-color: ${isPersistent ? 'rgba(74, 222, 128, 0.3)' : 'rgba(245, 158, 11, 0.3)'};
    }
    h1 { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    p.subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 22px; }
    .search-box { display: flex; gap: 8px; margin-bottom: 26px; }
    .search-box input {
      flex: 1; padding: 13px 18px; background: #0f172a; border: 1px solid #334155;
      border-radius: 12px; color: #fff; font-size: 15px; outline: none; direction: ltr;
      transition: border-color 0.2s;
    }
    .search-box input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2); }
    .search-box button {
      padding: 13px 22px; background: #0284c7; color: #fff; border: none;
      border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .search-box button:hover { background: #0369a1; }
    
    .section-title {
      font-size: 13px; font-weight: 700; color: #94a3b8; text-align: left;
      margin: 20px 0 10px; display: flex; align-items: center; gap: 6px;
    }
    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      margin-bottom: 22px;
    }
    .shortcut-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 8px;
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      text-decoration: none;
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .shortcut-card:hover {
      background: rgba(56, 189, 248, 0.12);
      border-color: rgba(56, 189, 248, 0.35);
      transform: translateY(-2px);
    }
    .shortcut-icon { font-size: 20px; margin-bottom: 6px; }

    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: left; }
    .spec-item {
      background: rgba(15, 23, 42, 0.55); padding: 10px 14px; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .spec-label { font-size: 11px; color: #64748b; margin-bottom: 3px; }
    .spec-val { font-size: 12px; color: #38bdf8; font-weight: 600; word-break: break-all; }
  </style>
  <script src="stealth.js"></script>
</head>
<body>
  <div class="container">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:14px;">
      <img src="icon.ico" alt="Logo" style="width:42px;height:42px;border-radius:10px;object-fit:contain;">
      <h1 style="margin:0;">${profile.name || 'Private Browser'}</h1>
    </div>
    <div class="badge-row">
      <span class="badge">🛡️ Privacy Shield Protection</span>
      <span class="badge badge-mode">${isPersistent ? '💾 Persistent Storage' : '⚡ Incognito (Ephemeral)'}</span>
    </div>
    <p class="subtitle">Isolated fingerprint, network tunnel, and anti-detect spoofing active.</p>
    <form class="search-box" onsubmit="event.preventDefault(); const q = document.getElementById('searchInp').value.trim(); if(q) location.href = (q.startsWith('http') ? q : 'https://duckduckgo.com/?q=' + encodeURIComponent(q));">
      <input id="searchInp" type="text" placeholder="Search the web or enter URL..." autofocus>
      <button type="submit">Go</button>
    </form>
    
    <div class="section-title">🚀 Quick Shortcuts:</div>
    <div class="shortcuts-grid">
      <a class="shortcut-card" href="https://www.google.com"><span class="shortcut-icon">🔍</span>Google</a>
      <a class="shortcut-card" href="https://youtube.com"><span class="shortcut-icon">🎥</span>YouTube</a>
      <a class="shortcut-card" href="https://wikipedia.org"><span class="shortcut-icon">📚</span>Wikipedia</a>
      <a class="shortcut-card" href="https://web.telegram.org"><span class="shortcut-icon">✈️</span>Telegram Web</a>
      <a class="shortcut-card" href="https://chatgpt.com"><span class="shortcut-icon">🤖</span>ChatGPT</a>
      <a class="shortcut-card" href="https://mail.google.com"><span class="shortcut-icon">✉️</span>Gmail</a>
      <a class="shortcut-card" href="https://github.com"><span class="shortcut-icon">🐙</span>GitHub</a>
    </div>

    <div class="section-title">💻 Emulated Hardware & Fingerprint Specs:</div>
    <div class="grid">
      <div class="spec-item">
        <div class="spec-label">Operating System & Platform</div>
        <div class="spec-val">${fp.os === 'linux' ? 'Linux' : (fp.os === 'mac' ? 'macOS' : 'Windows')} (${fp.platform || 'Win32'})</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">CPU Cores & Device Memory</div>
        <div class="spec-val">${fp.hardwareConcurrency || 8} Cores / ${fp.deviceMemory || 8} GB RAM</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">WebGL Graphics Card</div>
        <div class="spec-val">${fp.webglGpuName || 'NVIDIA GeForce RTX 4070'}</div>
      </div>
      <div class="spec-item">
        <div class="spec-label">Timezone & Language</div>
        <div class="spec-val">${fp.timezone || 'America/New_York'} (${fp.language || 'en-US'})</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(extDir, 'newtab.html'), newtabHtml, 'utf8');

    const manifestContent = JSON.stringify({
      manifest_version: 3,
      name: 'Private Browser Core',
      version: '2.0.0',
      icons: {
        "16": "icon.ico",
        "48": "icon.ico",
        "128": "icon.ico"
      },
      action: {
        default_icon: "icon.ico"
      },
      chrome_url_overrides: {
        newtab: 'newtab.html'
      },
      content_scripts: [
        {
          matches: ['<all_urls>'],
          js: ['stealth.js'],
          run_at: 'document_start',
          world: 'MAIN',
          all_frames: true,
          match_about_blank: true
        }
      ]
    }, null, 2);
    fs.writeFileSync(path.join(extDir, 'manifest.json'), manifestContent, 'utf8');
    fs.writeFileSync(path.join(extDir, 'stealth.js'), buildStealthScript(fp), 'utf8');
  } catch (err) {
    console.error('Failed to prepare stealth extension:', err);
  }

  // Pre-seed Preferences and Local State safely without overriding existing history/cookies
  try {
    const defaultDir = path.join(dir, 'Default');
    fs.mkdirSync(defaultDir, { recursive: true });

    const prefPath = path.join(defaultDir, 'Preferences');
    let existingPref = {};
    if (isPersistent && fs.existsSync(prefPath)) {
      try { existingPref = JSON.parse(fs.readFileSync(prefPath, 'utf8')); } catch {}
    }

    const mergedPref = Object.assign({}, existingPref, {
      profile: Object.assign({}, existingPref.profile, {
        name: profile.name,
        avatar_index: 26,
        using_default_avatar: false,
        default_content_setting_values: Object.assign({}, existingPref.profile && existingPref.profile.default_content_setting_values, { geolocation: 2 })
      }),
      signin: { allowed: false },
      account_manager: { enable_account_manager: false },
      sync: { has_setup_completed: false },
      edge: { fre: { has_user_seen_fre: true } },
      browser: {
        has_seen_welcome_page: true,
        check_default_browser: false
      },
      extensions: {
        alerts: {
          initialized: true
        }
      },
      dns_prefetching: { enabled: false },
      net: { network_prediction_options: 2 },
      webrtc: { ip_handling_policy: 'disable_non_proxied_udp' }
    });
    fs.writeFileSync(prefPath, JSON.stringify(mergedPref), 'utf8');

    const localStatePath = path.join(dir, 'Local State');
    let existingLocalState = {};
    if (isPersistent && fs.existsSync(localStatePath)) {
      try { existingLocalState = JSON.parse(fs.readFileSync(localStatePath, 'utf8')); } catch {}
    }
    const hasProxy = !!(profile.proxy && profile.proxy.enabled && profile.proxy.host && profile.proxy.port);
    const mergedLocalState = Object.assign({}, existingLocalState, {
      signin: { allowed: false },
      account_manager: { enable_account_manager: false },
      dns_over_https: hasProxy ? { mode: 'off' } : { mode: 'automatic' }
    });
    fs.writeFileSync(localStatePath, JSON.stringify(mergedLocalState), 'utf8');
  } catch {}

  const hasProxy = !!(profile.proxy && profile.proxy.enabled && profile.proxy.host && profile.proxy.port);
  let bridge = null;

  if (hasProxy) {
    try {
      bridge = await createProxyBridge(profile.proxy);
    } catch (bridgeErr) {
      if (!isPersistent) safeRmSessionDirAsync(dir);
      return { ok: false, error: 'خطا در فعال‌سازی پل ارتباطی پروکسی: ' + (bridgeErr.message || bridgeErr) };
    }
  }

  const args = [
    ...PRIVATE_FLAGS,
    `--user-data-dir=${dir}`,
    `--load-extension=${extDir}`,
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--app-user-model-id=com.jozmoz.privatebrowser'
  ];

  if (!hasProxy) {
    args.push('--enable-features=DnsOverHttps', '--dns-over-https-mode=automatic');
  }

  if (bridge) {
    args.push(`--proxy-server=http://127.0.0.1:${bridge.port}`);
  }

  if (!isPersistent) {
    args.push('--disk-cache-size=1', '--media-cache-size=1');
  }

  if (fp.userAgent) args.push(`--user-agent=${fp.userAgent}`);
  if (fp.screenWidth && fp.screenHeight) args.push(`--window-size=${fp.screenWidth},${fp.screenHeight}`);
  if (fp.language) {
    args.push(`--lang=${fp.language}`);
    args.push(`--accept-lang=${fp.language}`);
  }
  if (fp.timezone) {
    args.push(`--timezone=${fp.timezone}`);
  }

  const targetUrl = cleanStartupUrl(profile.startupUrl) || require('url').pathToFileURL(path.join(extDir, 'newtab.html')).href;
  args.push(targetUrl);

  let child;
  try {
    const spawnEnv = Object.assign({}, process.env, {
      GOOGLE_API_KEY: 'no',
      GOOGLE_DEFAULT_CLIENT_ID: 'no',
      GOOGLE_DEFAULT_CLIENT_SECRET: 'no'
    });
    child = spawn(bin, args, { stdio: 'ignore', env: spawnEnv });
  } catch (err) {
    if (bridge && typeof bridge.close === 'function') {
      try { bridge.close(); } catch {}
    }
    if (!isPersistent) safeRmSessionDirAsync(dir);
    return { ok: false, error: String((err && err.message) || err) };
  }

  running.set(token, { profileId: profile.id, child, dir, isEphemeral: !isPersistent, bridge });
  child.on('error', () => cleanupLaunch(token));
  child.on('exit', () => cleanupLaunch(token));

  broadcastRunning();
  return { ok: true };
}

function killTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32' && child.pid) {
      try {
        execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { timeout: 8000 }, () => {});
        return;
      } catch {}
    }
    child.kill();
  } catch {}
}

function stopProfile(profileId) {
  let stopped = 0;
  for (const [token, rec] of running) {
    if (rec.profileId !== profileId) continue;
    killTree(rec.child);
    stopped++;
    setTimeout(() => cleanupLaunch(token), 3000);
  }
  if (stopped > 0) broadcastRunning();
  return stopped;
}

function stopAllSync() {
  for (const [, rec] of running) {
    try {
      if (process.platform === 'win32' && rec.child && rec.child.pid) {
        require('child_process').spawnSync('taskkill.exe', ['/PID', String(rec.child.pid), '/T', '/F'], { timeout: 8000, windowsHide: true });
      } else if (rec.child) {
        try { rec.child.kill('SIGKILL'); } catch { try { rec.child.kill(); } catch {} }
      }
    } catch {}
  }
}

function cleanStaleSessions() {
  try {
    ensureDataDir();
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const activeDirs = new Set();
    for (const rec of running.values()) {
      if (rec && rec.dir) activeDirs.add(path.resolve(rec.dir));
    }
    for (const name of fs.readdirSync(SESSIONS_DIR)) {
      const full = path.join(SESSIONS_DIR, name);
      if (!activeDirs.has(path.resolve(full))) {
        safeRmSessionDir(full);
      }
    }
  } catch {}
}

function wipeProfile(profileId) {
  stopProfile(profileId);
  const profiles = loadProfiles();
  const p = profiles.find((x) => x.id === profileId);
  if (p) {
    p.lastLaunched = null;
    saveProfiles(profiles);
  }
  try {
    ensureDataDir();
    // Wipe persistent profile storage
    const persistentDir = path.join(PROFILES_STORAGE_DIR, profileId);
    if (fs.existsSync(persistentDir)) {
      safeRmSessionDirAsync(persistentDir);
    }
    // Also clean any temporary session dirs
    if (fs.existsSync(SESSIONS_DIR)) {
      const entries = fs.readdirSync(SESSIONS_DIR);
      for (const name of entries) {
        if (name.includes(`-${profileId}-`)) {
          safeRmSessionDirAsync(path.join(SESSIONS_DIR, name));
        }
      }
    }
  } catch {}
  broadcastRunning();
  return true;
}

function wipeAllSessions() {
  stopAllSync();
  try {
    ensureDataDir();
    if (fs.existsSync(SESSIONS_DIR)) {
      const entries = fs.readdirSync(SESSIONS_DIR);
      for (const name of entries) {
        safeRmSessionDirAsync(path.join(SESSIONS_DIR, name));
      }
    }
    if (fs.existsSync(PROFILES_STORAGE_DIR)) {
      const entries = fs.readdirSync(PROFILES_STORAGE_DIR);
      for (const name of entries) {
        safeRmSessionDirAsync(path.join(PROFILES_STORAGE_DIR, name));
      }
    }
  } catch {}
  const profiles = loadProfiles();
  profiles.forEach((p) => { p.lastLaunched = null; });
  saveProfiles(profiles);
  broadcastRunning();
  return true;
}

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('تغییر مسیر بیش از حد'));
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/vnd.github.v3+json,application/json,text/plain,*/*'
      },
      timeout: 30000
    };
    const req = https.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchText(res.headers.location, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('پاسخ نامعتبر سرور: ' + res.statusCode));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('اتمام مهلت اتصال')));
    req.on('error', reject);
  });
}

function downloadFile(url, dest, progressCb, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('تغییر مسیر بیش از حد'));
    try { if (fs.existsSync(dest) && redirects === 0) fs.rmSync(dest, { force: true }); } catch {}
    const parsed = new URL(url);
    const transport = parsed.protocol === 'http:' ? http : https;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'http:' ? 80 : 443),
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: 45000
    };
    const req = transport.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const nextUrl = new URL(res.headers.location, url).href;
        return resolve(downloadFile(nextUrl, dest, progressCb, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('دانلود ناموفق بود (کد ' + res.statusCode + ')'));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let done = 0;
      const ws = fs.createWriteStream(dest);
      const fail = (err) => {
        try { res.destroy(); } catch {}
        try { ws.destroy(); } catch {}
        try { if (fs.existsSync(dest)) fs.rmSync(dest, { force: true }); } catch {}
        reject(err);
      };
      res.on('data', (chunk) => {
        done += chunk.length;
        if (total > 0) {
          progressCb({ status: 'downloading', percent: Math.round((done / total) * 100) });
        } else {
          const mb = Math.min(95, Math.round(done / (1024 * 1024)));
          progressCb({ status: 'downloading', percent: mb });
        }
      });
      res.on('error', fail);
      ws.on('error', fail);
      ws.on('finish', () => resolve());
      res.pipe(ws);
    });
    req.on('timeout', () => req.destroy(new Error('اتمام مهلت اتصال به سرور دانلود')));
    req.on('error', (err) => {
      try { if (fs.existsSync(dest)) fs.rmSync(dest, { force: true }); } catch {}
      reject(err);
    });
  });
}

function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    // Try fast native tar.exe (built into Windows 10/11)
    execFile('tar.exe', ['-xf', zipPath, '-C', destDir], { timeout: 300000 }, (tarErr) => {
      if (!tarErr && fs.existsSync(destDir)) {
        return resolve();
      }
      // Fallback to PowerShell Expand-Archive
      execFile('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-Command',
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`
      ], { timeout: 600000 }, (psErr) => {
        if (psErr) return reject(new Error('استخراج فایل‌ها ناموفق بود: ' + (psErr.message || psErr)));
        resolve();
      });
    });
  });
}

let downloadInProgress = false;

async function downloadChromium(progressCb, force = false) {
  ensureDataDir();
  if (!force && fs.existsSync(CHROMIUM_EXE)) return { ok: true, cached: true };
  if (downloadInProgress) return { ok: false, error: 'ALREADY_DOWNLOADING' };
  downloadInProgress = true;

  const tmpZip = path.join(DATA_DIR, '.chromium-download.zip');
  const tmpDir = path.join(DATA_DIR, '.chromium-extract');
  try {
    progressCb({ status: 'resolving', percent: 0 });
    let version = UA_FULL_VERSION;

    const candidateUrls = [
      'https://github.com/ungoogled-software/ungoogled-chromium-windows/releases/download/151.0.7922.173-1/ungoogled-chromium_151.0.7922.173-1_windows_x64.zip',
      'https://downloads.sourceforge.net/project/ungoogled-chromium-win.mirror/151.0.7922.173-1/ungoogled-chromium_151.0.7922.173-1_windows_x64.zip',
      'https://download-chromium.appspot.com/dl/Win_x64?type=snapshots'
    ];

    try {
      const releaseJson = await fetchText(UGC_RELEASE_API);
      const releaseData = JSON.parse(releaseJson);
      if (releaseData.tag_name) version = releaseData.tag_name;
      const x64Asset = (releaseData.assets || []).find((a) =>
        a && a.name && (a.name.endsWith('_windows_x64.zip') || (a.name.includes('x64') && a.name.endsWith('.zip')))
      );
      if (x64Asset && x64Asset.browser_download_url) {
        candidateUrls.unshift(x64Asset.browser_download_url);
      }
    } catch (_) {}

    let downloadSuccess = false;
    let lastError = null;

    for (const url of candidateUrls) {
      try {
        await downloadFile(url, tmpZip, progressCb);
        if (fs.existsSync(tmpZip) && fs.statSync(tmpZip).size > 1000000) {
          downloadSuccess = true;
          break;
        }
      } catch (dlErr) {
        lastError = dlErr;
        try { if (fs.existsSync(tmpZip)) fs.rmSync(tmpZip, { force: true }); } catch (_) {}
      }
    }

    if (!downloadSuccess) {
      throw lastError || new Error('امکان برقراری ارتباط با سرورهای دانلود وجود نداشت. لطفاً اتصال اینترنت یا فیلترشکن را بررسی کنید.');
    }

    progressCb({ status: 'extracting', percent: 100 });
    try { if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    fs.mkdirSync(tmpDir, { recursive: true });
    await extractZip(tmpZip, tmpDir);

    function findChromeDir(base) {
      if (!fs.existsSync(base)) return null;
      if (fs.existsSync(path.join(base, 'chrome.exe'))) return base;
      try {
        const entries = fs.readdirSync(base);
        for (const e of entries) {
          const full = path.join(base, e);
          try {
            if (fs.statSync(full).isDirectory()) {
              const found = findChromeDir(full);
              if (found) return found;
            }
          } catch {}
        }
      } catch {}
      return null;
    }

    const inner = findChromeDir(tmpDir);
    if (!inner) throw new Error('فایل اجرایی کرومیوم در بسته دانلودشده پیدا نشد');

    try { if (fs.existsSync(CHROMIUM_DIR)) fs.rmSync(CHROMIUM_DIR, { recursive: true, force: true }); } catch {}
    try {
      fs.renameSync(inner, CHROMIUM_DIR);
    } catch (_) {
      fs.cpSync(inner, CHROMIUM_DIR, { recursive: true, force: true });
    }
    if (version) {
      try { fs.writeFileSync(CHROMIUM_VERSION_FILE, version, 'utf8'); } catch {}
    }
    if (!fs.existsSync(CHROMIUM_EXE)) throw new Error('نصب کرومیوم ناقص ماند');
    return { ok: true, version };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  } finally {
    downloadInProgress = false;
    try { if (fs.existsSync(tmpZip)) fs.rmSync(tmpZip, { force: true }); } catch {}
    try { if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

function createWindow() {
  const assetIcoCandidate = path.join(__dirname, 'assets', 'icon.ico');
  const assetPngCandidate = path.join(__dirname, 'assets', 'icon.png');
  const iconCandidate = path.join(__dirname, 'build', 'icon.ico');
  const pngCandidate = path.join(__dirname, 'build', 'icon.png');
  const rootIconCandidate = path.join(__dirname, 'icon.ico');
  const jozmozCandidate = path.join(__dirname, 'jozmoz.ico');
  let appIcon;
  if (fs.existsSync(assetIcoCandidate)) {
    appIcon = assetIcoCandidate;
  } else if (fs.existsSync(assetPngCandidate)) {
    appIcon = assetPngCandidate;
  } else if (fs.existsSync(iconCandidate)) {
    appIcon = iconCandidate;
  } else if (fs.existsSync(jozmozCandidate)) {
    appIcon = jozmozCandidate;
  } else if (fs.existsSync(pngCandidate)) {
    appIcon = pngCandidate;
  } else if (fs.existsSync(rootIconCandidate)) {
    appIcon = rootIconCandidate;
  }

  const win = new BrowserWindow({
    width: 1060,
    height: 740,
    minWidth: 800,
    minHeight: 560,
    autoHideMenuBar: true,
    title: 'Private Browser Pro — Anti-Detect & Isolated Engine',
    backgroundColor: '#0c0e12',
    ...(appIcon ? { icon: appIcon } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
  return win;
}

if (app && typeof app.requestSingleInstanceLock === 'function') {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      cleanStaleSessions();
      mainWindow = createWindow();
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
      });
    });

    app.on('before-quit', () => {
      try { stopAllSync(); } catch {}
      cleanStaleSessions();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    downloadChromium,
    findChromiumBinary,
    loadProfiles,
    saveProfiles,
    generateSmartFingerprint,
    createProxyBridge
  };
}

/* ==================== IPC Handlers ==================== */

if (ipcMain && typeof ipcMain.handle === 'function') {
  ipcMain.handle('profiles:list', () => loadProfiles());

ipcMain.handle('profiles:create', (e, p) => {
  const src = (p && typeof p === 'object') ? p : {};
  const profiles = loadProfiles();
  const profile = {
    id: 'p' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
    name: cleanName(src.name),
    color: cleanColor(src.color),
    startupUrl: cleanStartupUrl(src.startupUrl),
    proxy: cleanProxy(src.proxy),
    fingerprint: cleanFingerprint(src.fingerprint),
    saveData: src.saveData !== false,
    tags: cleanTags(src.tags),
    notes: cleanNotes(src.notes),
    createdAt: Date.now(),
    lastLaunched: null
  };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
});

ipcMain.handle('profiles:update', (e, id, updates) => {
  const src = (updates && typeof updates === 'object') ? updates : {};
  const profiles = loadProfiles();
  const idx = profiles.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  if (typeof src.name === 'string') profiles[idx].name = cleanName(src.name);
  if (typeof src.color === 'string') profiles[idx].color = cleanColor(src.color);
  if (typeof src.startupUrl === 'string') profiles[idx].startupUrl = cleanStartupUrl(src.startupUrl);
  if ('proxy' in src) profiles[idx].proxy = cleanProxy(src.proxy);
  if ('fingerprint' in src) profiles[idx].fingerprint = cleanFingerprint(src.fingerprint);
  if ('saveData' in src) profiles[idx].saveData = src.saveData !== false;
  if ('tags' in src) profiles[idx].tags = cleanTags(src.tags);
  if ('notes' in src) profiles[idx].notes = cleanNotes(src.notes);
  saveProfiles(profiles);
  return profiles[idx];
});

ipcMain.handle('profiles:delete', (e, id) => {
  const pid = String(id || '');
  stopProfile(pid);
  saveProfiles(loadProfiles().filter((x) => x.id !== pid));
  try {
    ensureDataDir();
    const persistent = path.join(PROFILES_STORAGE_DIR, pid);
    if (fs.existsSync(persistent)) safeRmSessionDirAsync(persistent);
    if (fs.existsSync(SESSIONS_DIR)) {
      const entries = fs.readdirSync(SESSIONS_DIR);
      for (const name of entries) {
        if (name.includes(`-${pid}-`)) safeRmSessionDirAsync(path.join(SESSIONS_DIR, name));
      }
    }
    const legacy = path.join(LEGACY_PROFILES_DIR, pid);
    if (fs.existsSync(legacy)) fs.rmSync(legacy, { recursive: true, force: true });
  } catch {}
  return true;
});

ipcMain.handle('profiles:clone', (e, id) => {
  const profiles = loadProfiles();
  const p = profiles.find((x) => x.id === id);
  if (!p) return null;
  const clone = {
    id: 'p' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
    name: cleanName(p.name + ' (کپی)'),
    color: cleanColor(p.color),
    startupUrl: cleanStartupUrl(p.startupUrl),
    proxy: p.proxy ? JSON.parse(JSON.stringify(p.proxy)) : null,
    fingerprint: generateSmartFingerprint(p.fingerprint ? {
      os: p.fingerprint.os,
      timezone: p.fingerprint.timezone,
      language: p.fingerprint.language,
      captchaSafe: p.fingerprint.captchaSafe !== false,
      webrtcPolicy: p.fingerprint.webrtcPolicy
    } : {}),
    saveData: p.saveData !== false,
    tags: Array.isArray(p.tags) ? [...p.tags] : [],
    notes: cleanNotes(p.notes),
    createdAt: Date.now(),
    lastLaunched: null
  };
  profiles.unshift(clone);
  saveProfiles(profiles);
  return clone;
});

function sendSocks5TestConnect(socket, host, port) {
  const hostBuf = Buffer.from(host, 'utf8');
  socket.write(Buffer.concat([
    Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuf.length]),
    hostBuf,
    Buffer.from([(port >> 8) & 0xff, port & 0xff])
  ]));
}

function testProxyConnection(p) {
  const start = Date.now();
  const host = p.host;
  const port = p.port;

  if (p.type === 'socks5') {
    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port, timeout: 8000 }, () => {
        const hasAuth = !!(p.username && p.password);
        socket.write(hasAuth ? Buffer.from([0x05, 0x01, 0x02]) : Buffer.from([0x05, 0x01, 0x00]));
      });

      socket.setTimeout(8000);
      let stage = 'greeting';
      let httpBuf = '';

      socket.on('data', (chunk) => {
        try {
          if (stage === 'greeting') {
            if (chunk[0] !== 0x05) {
              socket.destroy();
              return resolve({ ok: false, error: 'سرور انتخابی پروتکل معتبر SOCKS5 نیست.' });
            }
            const method = chunk[1];
            if (method === 0xFF) {
              socket.destroy();
              return resolve({ ok: false, error: 'پروکسی نیازمند نام کاربری و کلمه عبور است.' });
            }
            if (method === 0x02) {
              const u = Buffer.from(p.username || '', 'utf8');
              const pass = Buffer.from(p.password || '', 'utf8');
              const authBuf = Buffer.concat([
                Buffer.from([0x01, u.length]),
                u,
                Buffer.from([pass.length]),
                pass
              ]);
              stage = 'auth';
              socket.write(authBuf);
              return;
            }
            stage = 'connect';
            sendSocks5TestConnect(socket, 'api.ipify.org', 80);
          } else if (stage === 'auth') {
            if (chunk[1] !== 0x00) {
              socket.destroy();
              return resolve({ ok: false, error: 'نام کاربری یا کلمه عبور پروکسی SOCKS5 اشتباه است.' });
            }
            stage = 'connect';
            sendSocks5TestConnect(socket, 'api.ipify.org', 80);
          } else if (stage === 'connect') {
            if (chunk[1] !== 0x00) {
              const errMap = {
                0x01: 'خطای کلی در سرور پروکسی',
                0x02: 'ارتباط توسط قوانین پروکسی رد شد',
                0x03: 'شبکه مقصد در دسترس نیست (Network unreachable)',
                0x04: 'میزبان مقصد در دسترس نیست (Host unreachable)',
                0x05: 'اتصال توسط مقصد رد شد (Connection refused)',
                0x06: 'مدت زمان اتصال منقضی شد (TTL expired)'
              };
              socket.destroy();
              return resolve({
                ok: false,
                error: 'پروکسی به اینترنت دسترسی ندارد: ' + (errMap[chunk[1]] || ('کد ' + chunk[1]))
              });
            }
            stage = 'http';
            httpBuf = '';
            socket.write('GET /?format=json HTTP/1.1\r\nHost: api.ipify.org\r\nUser-Agent: curl/7.68.0\r\nConnection: close\r\n\r\n');
          } else if (stage === 'http') {
            httpBuf += chunk.toString('utf8');
            const idx = httpBuf.indexOf('{');
            const endIdx = httpBuf.lastIndexOf('}');
            if (idx !== -1 && endIdx > idx) {
              const latency = Date.now() - start;
              socket.destroy();
              let extIp = host;
              try {
                const parsed = JSON.parse(httpBuf.slice(idx, endIdx + 1));
                if (parsed && parsed.ip) extIp = parsed.ip;
              } catch {}
              resolve({ ok: true, latencyMs: latency, type: 'socks5', ip: extIp });
            }
          }
        } catch (err) {
          socket.destroy();
          resolve({ ok: false, error: 'خطا در خواندن پاسخ پروکسی: ' + err.message });
        }
      });

      socket.on('close', () => {
        if (stage === 'http' && httpBuf) {
          const latency = Date.now() - start;
          let extIp = host;
          try {
            const idx = httpBuf.indexOf('{');
            const endIdx = httpBuf.lastIndexOf('}');
            if (idx !== -1 && endIdx > idx) {
              const parsed = JSON.parse(httpBuf.slice(idx, endIdx + 1));
              if (parsed && parsed.ip) extIp = parsed.ip;
            }
          } catch {}
          resolve({ ok: true, latencyMs: latency, type: 'socks5', ip: extIp });
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ ok: false, error: 'عدم پاسخگویی اینترنت از طریق پروکسی در ۸ ثانیه (Timeout)' });
      });

      socket.on('error', (err) => {
        resolve({
          ok: false,
          error: 'خطا در اتصال به پورت پروکسی: ' + (err.code === 'ECONNREFUSED' ? 'پورت پروکسی بسته است یا برنامه VPN/V2Ray فعال نیست.' : err.message)
        });
      });
    });
  } else {
    // HTTP Proxy test
    return new Promise((resolve) => {
      const headers = { 'Host': 'api.ipify.org', 'User-Agent': 'Mozilla/5.0' };
      if (p.username && p.password) {
        headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${p.username}:${p.password}`).toString('base64');
      }

      const req = http.request({
        host,
        port,
        path: 'http://api.ipify.org/?format=json',
        method: 'GET',
        headers,
        timeout: 8000
      }, (res) => {
        if (res.statusCode === 407) {
          return resolve({ ok: false, error: 'نام کاربری یا کلمه عبور پروکسی اشتباه است (Error 407: Proxy Authentication Required)' });
        }
        if (res.statusCode >= 500) {
          return resolve({ ok: false, error: 'خطای سرور پروکسی در دسترسی به اینترنت (کد ' + res.statusCode + ')' });
        }
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const latency = Date.now() - start;
          let extIp = host;
          try {
            const data = JSON.parse(body);
            if (data && data.ip) extIp = data.ip;
          } catch {}
          resolve({ ok: true, latencyMs: latency, type: 'http', ip: extIp });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'عدم دریافت پاسخ اینترنت از طریق پروکسی در ۸ ثانیه (Timeout)' });
      });

      req.on('error', (err) => {
        resolve({
          ok: false,
          error: 'خطا در اتصال به پروکسی: ' + (err.code === 'ECONNREFUSED' ? 'پورت پروکسی بسته است.' : (err.message || err))
        });
      });

      req.end();
    });
  }
}

ipcMain.handle('proxy:test', async (e, proxyConfig) => {
  const p = cleanProxy(proxyConfig);
  if (!p) return { ok: false, error: 'مشخصات پروکسی ناقص است (آدرس یا پورت خالی است).' };
  return testProxyConnection(p);
});

ipcMain.handle('profiles:wipe', (e, id) => wipeProfile(String(id || '')));

ipcMain.handle('profiles:wipeAll', () => wipeAllSessions());

ipcMain.handle('profiles:randomizeFingerprint', (e, id) => {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  profiles[idx].fingerprint = generateSmartFingerprint();
  saveProfiles(profiles);
  return profiles[idx];
});

ipcMain.handle('profiles:launch', async (e, id) => {
  const profiles = loadProfiles();
  const p = profiles.find((x) => x.id === id);
  if (!p) return { ok: false, error: 'NOT_FOUND' };
  const result = await launchProfile(p);
  if (result.ok) {
    p.lastLaunched = Date.now();
    try { saveProfiles(profiles); } catch {}
  }
  return result;
});

ipcMain.handle('profiles:stop', (e, id) => ({ stopped: stopProfile(String(id || '')) }));

ipcMain.handle('status:running', () => runningSnapshot());

ipcMain.handle('status:chromium', () => {
  const bin = findChromiumBinary();
  return {
    found: !!bin,
    path: bin,
    name: 'jozmoz',
    isDownloadedChromium: bin === CHROMIUM_EXE,
    isEdge: !!bin && /msedge\.exe$/i.test(bin)
  };
});

ipcMain.handle('status:dataFolder', () => DATA_DIR);
ipcMain.handle('status:openDataFolder', () => { shell.openPath(DATA_DIR); });

ipcMain.handle('chromium:download', async (e) => {
  const progress = (p) => {
    try {
      if (!e.sender.isDestroyed()) e.sender.send('chromium:progress', p);
    } catch {}
  };
  try {
    return await downloadChromium(progress, true);
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

ipcMain.handle('ip:detect', async () => {
  return new Promise((resolve) => {
    const req = http.get('http://ip-api.com/json', { timeout: 6000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const info = JSON.parse(d);
          if (info && info.status === 'success') {
            return resolve({
              ok: true,
              ip: info.query,
              country: info.country,
              countryCode: info.countryCode,
              city: info.city,
              timezone: info.timezone,
              isp: info.isp
            });
          }
          resolve({ ok: false, error: 'Status not success' });
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'TIMEOUT' }); });
  });
});
}

