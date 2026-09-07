# Entity: Profile Manager (`main.js` / `data/profiles.json`)

## Classification
- **Criticality:** `STANDARD`
- **Availability Requirements:** High; must ensure profile configuration persistence without state corruption.
- **Trust Level:** Medium (Handles serialized user data loaded from disk and updated via IPC).

## Architectural Role & Responsibilities
The Profile Manager maintains configuration metadata and identity parameters for browser profiles.
- Persists data to `data/profiles.json` (or `userData/profiles.json` in packaged/installed mode).
- Implements atomic write semantics and automatic backup recovery (`profiles.corrupt-<timestamp>.json`) on parse errors.
- Provides profile creation, editing, cloning, deletion, and session wiping.
- Enforces data isolation settings (`saveData: true` for persistent storage vs `saveData: false` for ephemeral sessions).

## Data Schema & Attributes
Each profile record contains:
- `id`: Unique identifier (UUIDv4 or timestamp-derived string).
- `name`: Human-readable identifier.
- `color`: Accent color hex code.
- `startupUrl`: Initial destination or start page override.
- `saveData`: Boolean flag governing storage mode (Persistent vs Ephemeral).
- `proxy`: Object containing `{ enabled, type, host, port, user, pass }`.
- `fingerprint`: Hardware spoofing specification object.
- `lastLaunched`: Epoch millisecond timestamp of last execution.

## Known Constraints & Sanitization
- `cleanName(raw)`: Truncates to max 60 characters; defaults to 'Default Profile'.
- `cleanColor(raw)`: Enforces `HEX_COLOR` pattern (`^#[0-9a-fA-F]{6}$`), falling back to default theme blue.
- `cleanStartupUrl(raw)`: Enforces HTTP/HTTPS protocol scheme; trims whitespace.
- `cleanProxy(raw)`: Strips whitespace from host; parses port to integer (1-65535); standardizes proxy type to `'http'` or `'socks5'`.
- `cleanFingerprint(raw)`: Ensures fallback to default OS, valid screen resolutions, and legitimate GPU vendor strings.

## Associated Vulnerability Classes
- **[CWE-22: Path Traversal](../vulnerabilities/CWE-22_Path-Traversal.md)**
- **[CWE-319: Cleartext Transmission of Sensitive Information](../vulnerabilities/CWE-319_Cleartext-Transmission.md)**
- **[CWE-78: OS Command Injection / Process Argument Injection](../vulnerabilities/CWE-78_Command-Injection.md)**
