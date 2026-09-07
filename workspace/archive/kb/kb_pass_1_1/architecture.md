# System Architecture: Private Browser Pro

## Executive Overview

**Private Browser Pro** is an anti-detect browser environment and digital identity manager built primarily as a desktop application using Electron and Node.js, with a companion native Android implementation. The application isolates browser fingerprints, prevents hardware tracking (Canvas, AudioContext, WebGL, WebRTC), isolates persistent storage partitions, enforces zero-data ephemeral browsing sessions, and routes network traffic through a transparent local proxy bridge with remote DNS resolution.

---

## Architectural Zones & Trust Boundaries

```
 +-------------------------------------------------------------------------+
 | Zone 0: Untrusted External Network (Web Targets, Upstream Proxies, CDN) |
 +-------------------------------------------------------------------------+
                                    ^
                                    | (RFC 1928/1929 SOCKS5 / HTTP Tunnel)
                                    v
 +-------------------------------------------------------------------------+
 | Zone 2: Local Proxy Bridge (127.0.0.1:<ephemeral_port>)                |
 | - Node.js HTTP Forwarder                                                |
 | - Remote DNS Resolution over SOCKS5                                     |
 | - Upstream Credential Injection                                         |
 +-------------------------------------------------------------------------+
        ^                                               ^
        | (--proxy-server)                              | (proxy:test)
        v                                               |
 +-----------------------------+              +----------------------------+
 | Zone 1: Isolated Chromium   |              | Zone 3: Electron Main      |
 | Instances                   |              | Process (Node.js Runtime)  |
 | - Isolated User-Data-Dir    |<=============| - Child Process Spawner    |
 | - Dynamic Stealth Extension | (child_proc) | - Profile Storage Manager  |
 | - WebRTC Policy Enforced    |              | - Ungoogled Chromium Mgr   |
 +-----------------------------+              +----------------------------+
                                                            ^
                                                            | IPC Bridge (preload.js)
                                                            v
                                              +----------------------------+
                                              | Zone 4: Electron Renderer  |
                                              | (Sandboxed Chromium UI)    |
                                              | - Profile Cards & Forms    |
                                              | - Proxy Testing View       |
                                              | - i18n Localization Engine |
                                              +----------------------------+

 +-------------------------------------------------------------------------+
 | Zone 5: Android Native Subsystem (Room DB, WebView, ProxyController)    |
 +-------------------------------------------------------------------------+
```

### Trust Boundary Definitions

1. **Boundary A (Renderer <-> Main Process via IPC):**
   - **Interface:** `preload.js` utilizing `contextBridge.exposeInMainWorld('api', ...)`.
   - **Trust Level:** Renderer is sandboxed untrusted presentation layer; Main process has full OS privileges.
   - **Protection:** Strict whitelist of channels; input validation and sanitization on all payload fields before filesystem or process actions.

2. **Boundary B (Main Process <-> Chromium Engine Processes):**
   - **Interface:** `child_process.spawn(bin, args, { stdio: 'ignore', env })`.
   - **Trust Level:** Main process executes independent Ungoogled Chromium binaries.
   - **Protection:** Arguments are passed as an array (avoiding shell interpolation); flags are vetted via `PRIVATE_FLAGS`; startup URLs validated against protocol whitelist.

3. **Boundary C (Stealth Extension <-> Web Document Execution Context):**
   - **Interface:** Manifest V3 MV3 content script running in `world: 'MAIN'` at `document_start` on `<all_urls>`.
   - **Trust Level:** Injected into untrusted third-party web pages.
   - **Protection:** Native prototype hooking using closures and `WeakMap` to ensure `Function.prototype.toString` introspection returns `[native code]`.

4. **Boundary D (Local Proxy Bridge <-> Upstream Proxy Server):**
   - **Interface:** Outbound TCP socket connections via RFC 1928 (SOCKS5) and HTTP CONNECT.
   - **Trust Level:** Upstream proxy handles external routing.
   - **Protection:** Authentication performed in-flight; DNS queries resolved remotely through SOCKS5 to eliminate local DNS resolution leaks.

---

## Core Data Flows

### 1. Profile Creation & Configuration Persistence
1. User submits profile parameters via the frontend modal (`renderer.js`).
2. Data passed via `window.api.createProfile(data)` across the IPC boundary.
3. Main process validates and cleans fields:
   - Name: trimmed string, default fallback.
   - Color: validated against `HEX_COLOR` regex (`^#[0-9a-fA-F]{6}$`).
   - Startup URL: validated via `cleanStartupUrl()`.
   - Proxy: sanitized host, port, credentials.
   - Fingerprint: validated or randomly generated via `generateSmartFingerprint()`.
4. Serialized atomically to `data/profiles.json` (or Android `AppDatabase` via `ProfileDao`).

### 2. Browser Instance Launch & Isolation Pipeline
1. Invocation of `api.launchProfile(id)` triggers `launchProfile()` in `main.js`.
2. Storage Allocation:
   - **Persistent Mode:** Targets `data/profiles_storage/<id>`. Data persists between sessions.
   - **Ephemeral Mode:** Targets `data/.sessions/session-<id>-<timestamp>-<token>`. Marked for immediate destruction on exit.
3. Stealth Extension Generation:
   - Generates dedicated unpacked Chrome extension under `<sessionDir>/stealth-ext/`.
   - Writes `manifest.json`, `newtab.html`, and `stealth.js` compiled with the specific profile hardware/fingerprint specifications.
4. Preference & State Pre-seeding:
   - Writes JSON configurations to `Default/Preferences` and `Local State`.
   - Disables Google account signin, telemetry, DNS prefetching, and network prediction.
   - Sets WebRTC policy `disable_non_proxied_udp`.
5. Network Bridge Activation:
   - If proxy configured, starts in-process forwarder on `127.0.0.1:<randomPort>`.
   - Passes `--proxy-server=http://127.0.0.1:<port>` to Chromium.
6. Process Execution:
   - Executes `spawn(CHROMIUM_EXE, args, { stdio: 'ignore', env: spawnEnv })`.
   - Strips `GOOGLE_API_KEY`, `GOOGLE_DEFAULT_CLIENT_ID`, `GOOGLE_DEFAULT_CLIENT_SECRET`.
   - Registers process instance in `running` Map with UUID token.

### 3. Teardown & Ephemeral Cleanup Flow
1. Process exit detected via `child.on('exit')` or explicit `api.stopProfile(id)`.
2. Associated proxy bridge server is closed (`bridge.close()`).
3. If profile was Ephemeral (`isEphemeral === true`), `safeRmSessionDirAsync(dir)` is invoked.
4. Path safety checks verify that target directory resides strictly within `SESSIONS_DIR` before recursive deletion.
5. Notification broadcast to all renderer windows via `browser:status`.

---

## Availability, Reliability & Lifecycle Controls

- **Single Instance Enforcement:** `app.requestSingleInstanceLock()` prevents concurrent conflicting main process managers.
- **Windows Process Tree Killing:** On process termination, `taskkill.exe /PID <pid> /T /F` is executed with a timeout to prevent zombie Chromium renderer sub-processes.
- **Startup Crash Scavenger:** `cleanStaleSessions()` runs on application boot to detect and delete unreferenced session directories in `data/.sessions/`.
- **Corrupt Storage Recovery:** If `profiles.json` fails JSON parsing, it is automatically backed up to `data/profiles.corrupt-<timestamp>.json` and re-initialized as empty to prevent permanent crash loops.

---

## Component Taxonomy

| Component | Path / Module | Criticality | Role |
| :--- | :--- | :--- | :--- |
| **[Main Process](entities/main_process.md)** | `main.js` | `CRITICAL` | Electron core, process orchestration, filesystem I/O |
| **[Proxy Bridge](entities/proxy_bridge.md)** | `main.js` (lines ~987-1240) | `CRITICAL` | In-process HTTP/SOCKS5 tunnel & remote DNS forwarder |
| **[IPC Interface](entities/ipc_interface.md)** | `preload.js`, `main.js` | `CRITICAL` | Secure context bridge and message dispatcher |
| **[Profile Manager](entities/profile_manager.md)** | `main.js`, `data/profiles.json` | `STANDARD` | Profile persistence, validation, and cloning |
| **[Fingerprint Engine](entities/fingerprint_stealth.md)** | `main.js`, `renderer.js` | `STANDARD` | Hardware spoofing, stealth scripts, Canvas/Audio noise |
| **[Chromium Engine Manager](entities/chromium_engine_manager.md)** | `main.js` | `STANDARD` | Portable binary downloader, version checking, execution |
| **[Renderer UI](entities/renderer_ui.md)** | `renderer.js`, `index.html`, `styles.css` | `LOW_CRITICALITY` | User presentation, modal forms, and i18n |
| **[Android Subsystem](entities/android_subsystem.md)** | `app/src/main/java/...` | `STANDARD` | Native Android port with Room DB and WebView stealth |
