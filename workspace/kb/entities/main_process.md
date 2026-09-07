# Entity: Electron Main Process (`main.js`)

## Classification
- **Criticality:** `CRITICAL`
- **Availability Requirements:** Continuous while application runs; manages graceful child process termination and single-instance locks.
- **Trust Level:** High (Runs directly in Node.js environment with unrestricted OS system privileges).

## Architectural Role & Responsibilities
The Main Process orchestrates application lifecycle, filesystem access, child process execution, background proxy tunneling, and IPC event dispatching.
- Initializes and manages Electron `BrowserWindow`.
- Spawns Ungoogled Chromium instances with custom CLI argument flags (`child_process.spawn`).
- Enforces single instance execution via `app.requestSingleInstanceLock()`.
- Implements process cleanup via `taskkill.exe` on Windows to terminate Chromium process trees.
- Manages paths for portable vs installed modes (`resolveDataDir()`).

## Interfaces
- **Incoming IPC:** Receives asynchronous invokes from `renderer.js` via `ipcMain.handle` registered endpoints.
- **Outgoing IPC:** Broadcasts progress events (`chromium:progress`) and browser state snapshots (`browser:status`) to renderer webContents.
- **Process Spawning:** Spawns `chrome.exe` using `child_process.spawn(bin, args, { stdio: 'ignore', env })`.
- **Filesystem I/O:** Directly reads and writes `data/profiles.json`, session directories in `data/.sessions/`, persistent profiles in `data/profiles_storage/`, and extension files.

## Known Constraints & Sanitization
- **Directory Path Protection:** Paths are checked against `SESSIONS_DIR` before deletion (`safeRmSessionDirAsync`) to prevent arbitrary directory removal.
- **Process Arguments:** Hardcoded `PRIVATE_FLAGS` array avoids passing raw unsanitized user strings as flags.
- **Startup URL Sanitization:** `cleanStartupUrl()` rejects non-HTTP/HTTPS URLs (preventing `javascript:`, `file:`, or command flag injection).

## Associated Vulnerability Classes
- **[CWE-78: OS Command Injection / Process Argument Injection](../vulnerabilities/CWE-78_Command-Injection.md)**
- **[CWE-22: Path Traversal / Arbitrary File Erasure](../vulnerabilities/CWE-22_Path-Traversal.md)**
- **[CWE-94: Code Injection via Evaluated Content Scripts](../vulnerabilities/CWE-94_Code-Injection.md)**
