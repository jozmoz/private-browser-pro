# Entity: Local Proxy Bridge (`main.js:createProxyBridge`)

## Classification
- **Criticality:** `CRITICAL`
- **Availability Requirements:** Ephemeral; one instance per active proxied browser session. Must cleanly bind and unbind dynamic loopback TCP ports.
- **Trust Level:** Medium (Handles unauthenticated local connections from child Chromium browser instances).

## Architectural Role & Responsibilities
The Proxy Bridge is an in-process local HTTP proxy server implemented using Node.js `http` and `net` modules. It bridges requests from Chromium to upstream SOCKS5 or HTTP proxies.
- Listens strictly on `127.0.0.1` on an ephemeral OS-assigned TCP port.
- Implements RFC 1928 (SOCKS5) and RFC 1929 (Username/Password authentication) client protocols.
- Handles both HTTP web requests (`handleBridgeSocks5Http`) and HTTPS `CONNECT` tunnels (`handleBridgeSocks5Connect`).
- Forces SOCKS5 `ATYP: 0x03` (domain name addressing) to guarantee that all DNS queries are resolved by the upstream proxy server rather than the local host system.
- Injects `Proxy-Authorization: Basic <base64>` headers when forwarding through authenticated upstream HTTP proxies.

## Interfaces
- **Loopback Ingress:** Listens on `127.0.0.1:<port>` for incoming HTTP/HTTPS traffic from Chromium child instances.
- **Upstream Egress:** Outgoing TCP socket connections to remote upstream proxy (`net.connect({ host, port })`).
- **Internal API:** Instantiated via `createProxyBridge(upstreamConfig)` during `launchProfile()`; terminated via `bridge.close()`.

## Known Constraints & Sanitization
- **Interface Binding:** Explicitly bound to loopback `127.0.0.1` to prevent exposure on external network interfaces.
- **Port Management:** Dynamically allocates ports; closed on process exit or error to avoid port leaks.
- **Host/Port Validation:** Proxy configurations are pre-filtered with `cleanProxy()` before initiating bridge sockets.

## Associated Vulnerability Classes
- **[CWE-200: Information Exposure (DNS & IP Leakage)](../vulnerabilities/CWE-200_Information-Exposure.md)**
- **[CWE-319: Cleartext Transmission of Sensitive Information](../vulnerabilities/CWE-319_Cleartext-Transmission.md)**
