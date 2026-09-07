# Entity: Fingerprint Engine & Stealth Injection (`buildStealthScript`)

## Classification
- **Criticality:** `STANDARD`
- **Availability Requirements:** High; must generate compliant, error-free JavaScript scripts for every launched browser session.
- **Trust Level:** High impact on isolation (Executed in the `MAIN` execution world of every visited web page).

## Architectural Role & Responsibilities
The Fingerprint Engine generates deterministic, realistic hardware profiles and synthesizes client-side injection scripts (`stealth.js`) that intercept and override browser fingerprinting APIs.
- **WebGL Emulation:** Intercepts `WebGLRenderingContext.prototype.getParameter` and `WebGL2RenderingContext.prototype.getParameter` to return custom GPU vendor and renderer strings (e.g., NVIDIA GeForce RTX 4090, AMD Radeon RX 7900 XTX, Apple M-series).
- **Canvas Noise:** Hooks `HTMLCanvasElement.prototype.toDataURL` to inject subtle, deterministic pixel variations, altering hash signatures without visual corruption.
- **AudioContext Perturbation:** Modifies `AudioBuffer.prototype.getChannelData` by adding minute floating-point offsets ($10^{-7}$), scrambling acoustic frequency fingerprinting.
- **Dynamic Client Hints:** Synchronizes `navigator.userAgentData.brands`, `mobile`, and `platform` with the emulated User-Agent to avoid Cloudflare/Akamai bot-flagging mismatches.
- **Native Method Masking:** Hooks `Function.prototype.toString` utilizing a `WeakMap` lookup table to ensure hooked properties return `function () { [native code] }`.
- **Automation Masking:** Configures `navigator.webdriver = undefined` and masks `chrome.runtime` markers.

## Interfaces
- **Extension Injection:** Compiled into `<sessionDir>/stealth-ext/stealth.js` and registered in `manifest.json` under `content_scripts` with `world: 'MAIN'` and `run_at: 'document_start'`.
- **Companion Mobile Implementation:** `StealthScriptBuilder.kt` provides equivalent script generation for Android WebView injections.

## Known Constraints & Sanitization
- **JSON Serialization:** Profile attributes are encoded using `JSON.stringify(config)` before embedding into script templates to prevent arbitrary JavaScript code injection.
- **Non-Destructive Hooking:** Hooks preserve underlying prototype chains and native error behaviours (`origGetParameter.apply(this, arguments)`).

## Associated Vulnerability Classes
- **[CWE-94: Code Injection via Evaluated Content Scripts](../vulnerabilities/CWE-94_Code-Injection.md)**
- **[CWE-200: Information Exposure (Fingerprint Mismatch & Leakage)](../vulnerabilities/CWE-200_Information-Exposure.md)**
