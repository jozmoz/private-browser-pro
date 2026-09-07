# Entity: IPC Interface & Context Bridge (`preload.js` / `ipcMain`)

## Classification
- **Criticality:** `CRITICAL`
- **Availability Requirements:** High; core communication bus between sandboxed renderer and privileged main process.
- **Trust Level:** Demarcation line between untrusted renderer (`window`) and privileged Node.js runtime.

## Architectural Role & Responsibilities
The IPC interface establishes a secure boundary utilizing Electron's `contextIsolation` and `contextBridge.exposeInMainWorld('api', ...)`. It prevents the renderer process from acquiring direct access to Node.js built-ins (`fs`, `child_process`, `net`).
- Restricts invocations to explicitly enumerated channels.
- Mediates all state read/write operations for profiles, processes, and network checks.
- Dispatches streaming updates (e.g. download progress, browser status).

## Registered IPC Channels

| Channel | Method | Handler / Purpose |
| :--- | :--- | :--- |
| `profiles:list` | `handle` | Returns array of profiles from `loadProfiles()` |
| `profiles:create` | `handle` | Validates, generates UUID, saves new profile |
| `profiles:update` | `handle` | Updates profile attributes after sanitization |
| `profiles:delete` | `handle` | Terminates active instance, deletes persistent storage, updates JSON |
| `profiles:wipe` | `handle` | Stops profile, clears disk data in `data/profiles_storage/<id>` |
| `profiles:wipeAll` | `handle` | Stops all profiles, deletes all session directories |
| `profiles:clone` | `handle` | Duplicates profile with new UUID and randomized fingerprint |
| `proxy:test` | `handle` | Tests TCP and HTTP connectivity to specified proxy target |
| `profiles:randomizeFingerprint` | `handle` | Generates a fresh hardware fingerprint profile |
| `profiles:launch` | `handle` | Allocates directories, pre-seeds configs, starts Chromium process |
| `profiles:stop` | `handle` | Kills process tree associated with profile ID |
| `status:running` | `handle` | Returns snapshot of active process tokens and metadata |
| `status:chromium` | `handle` | Reports presence and path of Ungoogled Chromium binary |
| `status:dataFolder` | `handle` | Returns path to active data directory |
| `status:openDataFolder` | `handle` | Invokes `shell.openPath` to view files in OS file manager |
| `shell:openExternal` | `handle` | Opens external URLs in system browser (restricted to `http://` and `https://`) |
| `chromium:download` | `handle` | Initiates automated download of portable Chromium zip archive |
| `ip:detect` | `handle` | Performs direct external IP and country check |

## Known Constraints & Sanitization
- **URL Whitelisting in `shell:openExternal`:** Validates URL with `/^https?:\/\//i` before passing to `shell.openExternal()`, preventing execution of arbitrary protocols (`file://`, `cmd:`, `powershell:`).
- **ID Casting:** All profile IDs passed to handlers are explicitly cast to strings (`String(id || '')`) and validated against existing profile records.

## Associated Vulnerability Classes
- **[CWE-78: Command Injection via Parameter Tampering](../vulnerabilities/CWE-78_Command-Injection.md)**
- **[CWE-22: Path Traversal via Malicious Profile IDs](../vulnerabilities/CWE-22_Path-Traversal.md)**
- **[CWE-200: Information Exposure](../vulnerabilities/CWE-200_Information-Exposure.md)**
