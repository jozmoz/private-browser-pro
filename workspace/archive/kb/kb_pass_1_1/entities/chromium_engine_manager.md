# Entity: Chromium Engine Manager (`main.js`)

## Classification
- **Criticality:** `STANDARD`
- **Availability Requirements:** High; browser launching is blocked if a valid engine binary is not present on disk.
- **Trust Level:** High (Executes external native binaries on the host system).

## Architectural Role & Responsibilities
The Chromium Engine Manager ensures that an ungoogled, non-telemetric Chromium distribution is available, verified, and safely executed.
- Manages portable Chromium binaries in `data/chromium/chrome.exe`.
- Queries GitHub API (`UGC_RELEASE_API`) and fallback CDN mirrors to locate the latest Ungoogled Chromium release packages.
- Downloads zip archives over HTTPS, emitting streaming progress metrics via `chromium:progress` IPC events.
- Extracts zip archives into `data/chromium/` using safe unzipping routines.
- Constructs command-line arguments and stripped process environment variables (`GOOGLE_API_KEY: 'no'`, `GOOGLE_DEFAULT_CLIENT_ID: 'no'`).

## Interfaces
- **IPC Trigger:** Invoked via `api.downloadChromium()` from the user interface.
- **IPC Status Query:** Invoked via `api.getChromiumStatus()` to determine binary existence and paths.
- **Network Ingress:** HTTPS downloads from GitHub releases (`api.github.com`, `github.com`) and third-party mirrors.
- **Filesystem Output:** Writes to `data/chromium/`, `data/.chromium-download.zip`, and `data/.chromium-extract/`.

## Known Constraints & Sanitization
- **Binary Verification:** Checks for the presence of `chrome.exe` before permitting profile launch.
- **Execution Sanitization:** Launches `chrome.exe` directly via `child_process.spawn(bin, args)` without intermediate shell interpreter (`shell: false`).

## Associated Vulnerability Classes
- **[CWE-22: Path Traversal during Archive Extraction](../vulnerabilities/CWE-22_Path-Traversal.md)**
- **[CWE-78: OS Command Injection / Process Argument Injection](../vulnerabilities/CWE-78_Command-Injection.md)**
