# Entity: Renderer UI & Presentation Layer (`renderer.js`, `index.html`, `styles.css`)

## Classification
- **Criticality:** `LOW_CRITICALITY`
- **Availability Requirements:** Standard desktop UI responsiveness; graceful error message rendering.
- **Trust Level:** Low (Executed within Chromium sandbox, isolated from Node.js APIs by `preload.js`).

## Architectural Role & Responsibilities
The Renderer UI provides the graphical user interface for managing profiles, testing proxies, configuring spoofed parameters, and monitoring active instances.
- **Profile Dashboard:** Renders profiles as interactive cards displaying status badges, proxy tags, and spoofed hardware specs.
- **Modal Editors:** Facilitates profile configuration (name, color, startup URL, proxy configuration, OS selection, GPU presets, noise toggles).
- **Proxy Diagnostic Tool:** Sends proxy configuration to Main process and visualizes response time, HTTP status, or connection failures.
- **Bilingual Engine (i18n):** Real-time switching between English (LTR) and Persian (RTL) across all DOM elements and dynamic notifications.
- **System Telemetry Display:** Listens to `browser:status` updates to toggle active indicators on profile cards in real time.

## Interfaces
- **DOM Event Listeners:** Responds to user mouse and keyboard input.
- **IPC Invocations:** Communicates with Main process strictly through `window.api` methods declared in `preload.js`.
- **IPC Event Listeners:** Subscribes to `api.onChromiumProgress` and `api.onBrowserStatus`.

## Known Constraints & Sanitization
- **DOM Sanitization:** Text inputs (names, tags, notes) must be rendered safely (using `textContent` or escaped strings) to prevent DOM-based XSS.
- **Isolation Enforcement:** Cannot access Node.js modules or require external packages directly.

## Associated Vulnerability Classes
- **[CWE-200: Information Exposure](../vulnerabilities/CWE-200_Information-Exposure.md)**
