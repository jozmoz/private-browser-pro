# Bug Class: CWE-200 (Information Exposure - Fingerprint, DNS & IP Leaks)

## Description
Information exposure in anti-detect and privacy-oriented browsers occurs when subtle metadata leaks bypass network tunnels or reveal synthetic browser fingerprint spoofing. These exposures undermine identity isolation, allowing tracking companies, Cloudflare, or surveillance engines to de-anonymize the user.

## Primary Threat Vectors in Anti-Detect Browsers
1. **DNS Leakage:** If domain resolution occurs via the operating system's local DNS resolver before establishing a proxy socket, the user's ISP and local eavesdroppers observe all visited hostnames.
2. **WebRTC IP Leakage:** WebRTC's Interactive Connectivity Establishment (ICE) protocol can transmit STUN/TURN binding requests via direct UDP packets, bypassing HTTP/SOCKS proxies and exposing the real public IP address.
3. **Fingerprint Incoherency (Heuristic Flagging):** Discrepancies between emulated components (e.g., claiming a Windows OS User-Agent while `navigator.platform` reports `MacIntel`, or claiming Chrome 130 while `navigator.userAgentData.brands` reports Chromium 120) are flagged by bot-detection algorithms.
4. **Canvas / Audio Correlation:** Standard canvas rendering and audio synthesis produce unique mathematical hashes tied to the host GPU driver and sound card, facilitating cross-session identity correlation.

## Relevant Code Areas & Components
- **[Local Proxy Bridge](../entities/proxy_bridge.md):** Implements remote SOCKS5 DNS resolution.
- **[Fingerprint Engine](../entities/fingerprint_stealth.md):** Injects prototype hooks for WebGL, Canvas, Audio, and Client Hints.
- **[Main Process](../entities/main_process.md):** Sets Chromium preferences and launch flags (`--force-webrtc-ip-handling-policy=disable_non_proxied_udp`).
- **[Android Subsystem](../entities/android_subsystem.md):** Configures Android WebView proxy and stealth script.

## Anti-Pattern Example (What NOT To Do)
```javascript
// DANGEROUS: Resolving DNS locally on the host before connecting to SOCKS5
const dns = require('dns');
dns.lookup(targetHost, (err, ip) => {
  // Local resolver leaked targetHost to ISP!
  connectSocks5ByIp(ip, targetPort);
});
```

```javascript
// DANGEROUS: Leaving WebRTC unconstrained when proxy is enabled
// Allows WebRTC ICE candidates to send UDP requests over default network adapter
const args = ['--proxy-server=socks5://1.2.3.4:1080'];
// Missing: --force-webrtc-ip-handling-policy=disable_non_proxied_udp
```

## Defensive Architecture & Mitigations in Codebase
1. **Remote DNS in SOCKS5:** The proxy bridge explicitly constructs RFC 1928 requests using Address Type `0x03` (Domain Name), compelling the upstream proxy server to perform remote DNS resolution.
2. **WebRTC Policy Enforcement:** Chromium is configured with `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`, and `Preferences` pre-seeds `webrtc.ip_handling_policy: 'disable_non_proxied_udp'`.
3. **Deterministic Noise Injection:** Canvas 2D and AudioBuffer implementations inject subtle, deterministic variations ($10^{-7}$ perturbation) to disrupt hash calculations without breaking web application rendering.
4. **Synchronized Client Hints:** `navigator.userAgentData` is explicitly overridden to match the configured User-Agent version and operating system.
