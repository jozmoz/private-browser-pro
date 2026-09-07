# Mantis Knowledge Base Catalog

Welcome to the Mantis Knowledge Base for **Private Browser Pro** (`jozmoz/private-browser-pro`). This catalog serves as the canonical navigational map for security architects, strategists, and code reviewers.

---

## Core System Architecture
- **[System Architecture](architecture.md):** Complete high-level architecture defining zone boundaries, network proxy tunnels, Chromium child process isolation, and data flows.

---

## System Entities & Components

| Component | Path | Criticality | 1-Line Summary |
| :--- | :--- | :--- | :--- |
| **[Main Process](entities/main_process.md)** | `main.js` | `CRITICAL` | Node.js host controller managing application lifecycle, process spawning, filesystem storage, and IPC dispatch. |
| **[Proxy Bridge](entities/proxy_bridge.md)** | `main.js` | `CRITICAL` | In-process HTTP/SOCKS5 loopback forwarder enforcing remote DNS resolution and WebRTC leak prevention. |
| **[IPC Interface](entities/ipc_interface.md)** | `preload.js`, `main.js` | `CRITICAL` | Context-isolated IPC boundary exposing whitelisted asynchronous APIs to the renderer window. |
| **[Profile Manager](entities/profile_manager.md)** | `main.js`, `data/` | `STANDARD` | State serialization engine managing profile metadata, data sanitization, and corrupt storage recovery. |
| **[Fingerprint Engine](entities/fingerprint_stealth.md)** | `main.js`, `renderer.js` | `STANDARD` | Synthetic identity generator injecting prototype overrides for Canvas, Audio, WebGL, and Client Hints. |
| **[Chromium Engine Manager](entities/chromium_engine_manager.md)** | `main.js` | `STANDARD` | Ungoogled Chromium portable binary downloader, integrity validator, and stripped process execution manager. |
| **[Renderer UI](entities/renderer_ui.md)** | `renderer.js`, `index.html` | `LOW_CRITICALITY` | Sandboxed glassmorphism desktop user interface featuring dual-language i18n and real-time monitoring. |
| **[Android Subsystem](entities/android_subsystem.md)** | `app/` | `STANDARD` | Native Android application port featuring Room ORM database, AndroidX WebKit ProxyController, and WebView stealth. |

---

## Historical & Potential Vulnerability Classes

| Vulnerability Class | Reference Document | Primary Threat Focus |
| :--- | :--- | :--- |
| **CWE-78** | **[OS Command & Argument Injection](vulnerabilities/CWE-78_Command-Injection.md)** | Injection of untrusted CLI arguments or command prefixes when spawning `chrome.exe`. |
| **CWE-200** | **[Information Exposure (Leaks & Fingerprints)](vulnerabilities/CWE-200_Information-Exposure.md)** | De-anonymization via WebRTC non-proxied UDP leakage, local DNS queries, or fingerprint incoherency. |
| **CWE-22** | **[Path Traversal & Arbitrary Deletion](vulnerabilities/CWE-22_Path-Traversal.md)** | Directory traversal in profile IDs or Zip Slip vulnerabilities during binary extraction and session wiping. |
| **CWE-94** | **[Code Injection via Content Scripts](vulnerabilities/CWE-94_Code-Injection.md)** | Arbitrary script evaluation in the browser's `MAIN` world via improper string template interpolation. |
| **CWE-319** | **[Cleartext Transmission & Storage](vulnerabilities/CWE-319_Cleartext-Transmission.md)** | Unencrypted plaintext storage and network transmission of upstream proxy authentication credentials. |

---

## Machine-Readable Dependencies
- **[dependencies.json](dependencies.json):** Directed import/reference graph mapping dependencies across system modules for fan-out analysis.
