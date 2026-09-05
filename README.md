# 🛡️ Private Browser Pro

> **Advanced Anti-Detect Browser Manager & Zero-Data Chromium Isolation Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chromium: 151](https://img.shields.io/badge/Chromium-v151-green.svg)](https://www.chromium.org/)
[![Electron](https://img.shields.io/badge/Electron-v33-blueviolet.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20x64-informational.svg)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()
[![Telegram: @jozm0z](https://img.shields.io/badge/Telegram-@jozm0z-2CA5E0?logo=telegram&logoColor=white)](https://t.me/jozm0z)

> 🌐 **Language:** **English** | [🇮🇷 **مشاهده مستندات به زبان فارسی (Persian README)**](README_FA.md)

**Private Browser Pro** is a lightweight, ultra-secure desktop application designed to manage isolated browser profiles with dedicated digital identities (anti-detect fingerprinting), zero-data ephemeral browsing sessions, and built-in proxy tunneling with DNS leak prevention.

---

## 📥 Download v1.0.0 (Windows 64-bit)

| Package | Type | Direct Download Link |
| :--- | :--- | :--- |
| 💿 **Windows Installer (Setup)** | NSIS Setup | [**Download Setup (v1.0.0)**](https://github.com/jozmoz/private-browser-pro/releases/download/v1.0.0/Private.Browser.Pro.Setup.1.0.0.exe) |
| 🚀 **Standalone Portable** | Portable .exe | [**Download Portable (v1.0.0)**](https://github.com/jozmoz/private-browser-pro/releases/download/v1.0.0/Private.Browser.Pro.1.0.0.portable.exe) |
| 📦 **GitHub Releases** | All Assets & Notes | [**View Release v1.0.0**](https://github.com/jozmoz/private-browser-pro/releases/tag/v1.0.0) |

---

## 🌟 Key Features

### 1. 🛡️ Advanced Fingerprint & Hardware Spoofing
- **WebGL & GPU Emulation:** Real-world hardware profiles for NVIDIA (RTX 4090, 4080, 4070, 3080), AMD Radeon (RX 7900 XTX, 6700 XT), Intel Arc, and Apple Silicon.
- **Canvas & AudioContext Noise:** Injects imperceptible, deterministic noise to prevent cross-site canvas and audio fingerprint hash tracking.
- **Dynamic Client Hints:** Automatically synchronizes `navigator.userAgentData.brands` and `uaFullVersion` with the User-Agent to avoid bot-flagging mismatches.
- **Webdriver Masking:** Emulates standard browser behavior with `navigator.webdriver = undefined` and native code introspection.
- **Cloudflare & Captcha Safe:** Specifically tuned to pass Cloudflare Turnstile, hCaptcha, and reCAPTCHA tests without triggering automated browser blocks.

### 2. 🔒 Storage Isolation & Ephemeral Modes
- **💾 Persistent Mode:** Stores history, logins, and cookies in an isolated directory (`data/profiles_storage/<id>`).
- **⚡ Ephemeral Mode (Zero-Data):** Launches temporary sessions that are securely destroyed upon closing the browser window, leaving zero traces on disk.
- **🧹 Single-Click Wipe:** Easily wipe cache, sessions, or all profiles on demand.

### 3. 🌐 Proxy Tunnel Bridge & Anti-DNS Leak
- **Transparent Local Proxy Bridge:** Native RFC 1928/1929 SOCKS5 and HTTP proxy bridge with authentication support.
- **Remote DNS Resolution:** Forces DNS queries to resolve through the proxy server, preventing DNS leaks.
- **WebRTC Protection:** Disables non-proxied UDP to ensure real IP addresses are never leaked via WebRTC.

### 4. ⚡ Clean End-User Chromium Engine
- **Normal User Build:** Powered by clean, portable **Ungoogled Chromium** (version 151).
- **No Test Banners:** Free from "Chrome for Testing" watermarks, `--disable-blink-features` warnings, or missing Google API key banners.
- **Modern Start Page:** Custom dark-mode dashboard with quick shortcuts (Google, YouTube, GitHub, Telegram, ChatGPT) and real-time hardware specs.

### 5. 🌍 Bilingual Interface (English & Persian)
- Default English interface with seamless one-click toggle to Persian (RTL).
- Full internationalization across all views, modal forms, status badges, and notifications.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- Windows 10 / 11 (64-bit)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/private-browser-pro.git
   cd private-browser-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

> **Note:** On first launch, if Chromium is not detected, you can download the portable version directly with a single click from the application header.

---

## 📂 Project Structure

```
private-browser-pro/
├── data/
│   ├── profiles.json          # Profile configurations & metadata
│   └── chromium/              # Portable Chromium binaries (auto-downloaded)
├── index.html                 # Main Electron renderer UI
├── main.js                    # Electron main process, proxy bridge & browser launcher
├── preload.js                 # Secure context bridge IPC
├── renderer.js                # Frontend controller, i18n engine & profile management
├── styles.css                 # Dark-mode styling, responsive grid & animations
├── package.json               # Project manifest & scripts
├── README.md                  # English documentation
└── README_FA.md               # Persian documentation
```

---

## 💬 Contact Admin & Support

For questions, support, or direct inquiries with the administrator:
- 📱 **Telegram:** [@jozm0z](https://t.me/jozm0z)
- 🌐 **Telegram Link:** [https://t.me/jozm0z](https://t.me/jozm0z)

---

## ☕ Donation / Support

If you find this project helpful and would like to support its development, you can make a donation via cryptocurrency:

- **Currency:** USDT
- **Network:** BNB Smart Chain (BEP-20)
- **Deposit Address:**
  ```text
  0x37489CD5817dBC8d4D15B4C6609A577b3481995f
  ```

Thank you for your support! ❤️

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
