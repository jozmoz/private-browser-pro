# Bug Class: CWE-22 (Path Traversal & Arbitrary File Manipulation)

## Description
Path traversal vulnerabilities occur when file system path construction incorporates unsanitized user inputs, permitting sequences such as `../` (or `..\` on Windows) to escape designated root directories. In Private Browser Pro, path traversal could lead to unauthorized file deletion (during session cleanup), arbitrary file overwrites, or directory manipulation across the host system.

## Primary Threat Vectors in Private Browser Pro
1. **Profile ID Traversal:** If a profile ID contains directory traversal sequences, path concatenations like `path.join(PROFILES_STORAGE_DIR, profile.id)` could target critical system directories.
2. **Session Cleanup Escalation:** The session cleanup and wipe routines (`safeRmSessionDir`, `wipeProfile`) recursively delete directories on disk. An escaped path could cause destructive data loss.
3. **Zip Slip Extraction:** During portable Chromium binary downloading and extraction (`yauzl` / zip unpacking), malicious archive entry filenames containing relative paths (e.g. `../../Windows/System32/...`) could overwrite arbitrary host files.

## Relevant Code Areas & Components
- **[Electron Main Process](../entities/main_process.md):** Performs session directory allocation, profile wiping, and cleanup.
- **[Profile Manager](../entities/profile_manager.md):** Stores and validates profile IDs.
- **[Chromium Engine Manager](../entities/chromium_engine_manager.md):** Unpacks portable Chromium zip archives.
- **[IPC Interface](../entities/ipc_interface.md):** Receives profile IDs from renderer.

## Anti-Pattern Example (What NOT To Do)
```javascript
// DANGEROUS: Deleting directory directly from unsanitized input
function wipeSession(sessionId) {
  const targetDir = path.join(SESSIONS_DIR, sessionId);
  fs.rmSync(targetDir, { recursive: true, force: true });
  // If sessionId is: "../../Windows", system files are targeted!
}
```

```javascript
// DANGEROUS: Unzipping archive entries without path containment check
zipfile.on('entry', (entry) => {
  const destPath = path.join(extractDir, entry.fileName);
  // Zip Slip: entry.fileName could be "../../../evil.dll"
  fs.createWriteStream(destPath);
});
```

## Defensive Architecture & Mitigations in Codebase
1. **Containment Verification in Deletion (`safeRmSessionDir`):**
   ```javascript
   function safeRmSessionDir(dir) {
     const resolved = path.resolve(dir);
     const base = path.resolve(SESSIONS_DIR);
     if (!resolved.startsWith(base + path.sep)) {
       console.error('Refusing to delete unsafe directory:', dir);
       return;
     }
     fs.rmSync(resolved, { recursive: true, force: true });
   }
   ```
2. **ID Normalization & Generation:** Profile IDs are internally generated using UUIDv4 algorithms (`crypto.randomUUID()`), containing strictly hexadecimal characters and hyphens.
3. **Safe Archive Unpacking:** Unpack paths are resolved and verified to ensure they reside strictly within the intended destination directory before writing files.
