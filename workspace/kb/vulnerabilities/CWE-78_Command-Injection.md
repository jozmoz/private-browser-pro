# Bug Class: CWE-78 (OS Command & Argument Injection)

## Description
Command and argument injection occurs when untrusted user input is passed directly to system shells or process execution APIs (`child_process.exec`, `child_process.spawn`, `execFile`) without strict escaping or parameter separation. In desktop applications like Private Browser Pro, process argument injection can allow an attacker to launch arbitrary executables, disable security sandbox flags, or execute malicious payloads.

## Relevant Code Areas & Components
- **[Electron Main Process](../entities/main_process.md):** Invokes `child_process.spawn(bin, args)` to execute `chrome.exe`.
- **[Chromium Engine Manager](../entities/chromium_engine_manager.md):** Formulates CLI flags passed to the browser binary.
- **[IPC Interface](../entities/ipc_interface.md):** Handles `profiles:launch` and passes profile parameters to spawn logic.

## Anti-Pattern Example (What NOT To Do)
```javascript
// DANGEROUS: Passing user-controlled startupUrl directly into shell string
const { exec } = require('child_process');
exec(`chrome.exe --proxy-server=${profile.proxy} "${profile.startupUrl}"`); 
// If startupUrl is: " & calc.exe &
```

```javascript
// DANGEROUS: Allowing unvalidated custom flags in CLI arguments array
const args = ['--user-data-dir=...', ...profile.customFlags];
// If customFlags contains: '--renderer-cmd-prefix=cmd.exe /c start evil.bat'
```

## Defensive Architecture & Mitigations in Codebase
1. **Never Invoke via Shell:** Always use `child_process.spawn(bin, args, { shell: false })` with arguments supplied as discrete array elements rather than concatenated strings.
2. **Flag Whitelisting:** Chromium parameters are governed strictly by the internal `PRIVATE_FLAGS` array. User custom flags are not accepted directly from the UI.
3. **Startup URL Validation:** The `cleanStartupUrl()` helper parses and validates target URLs against a strict whitelist of web protocols (`http:`, `https:`), rejecting custom URI schemes, file paths, or CLI switch payloads.
