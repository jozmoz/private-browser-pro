# Bug Class: CWE-319 (Cleartext Storage & Transmission of Sensitive Data)

## Description
Cleartext transmission and storage of sensitive credentials (such as upstream proxy usernames and passwords) occurs when confidential data is maintained on disk or transmitted over internal/external channels without encryption or cryptographic protection. In Private Browser Pro, proxy credentials may be stored unencrypted in local configuration files or exposed in transit.

## Primary Threat Vectors in Private Browser Pro
1. **Unencrypted Configuration on Disk (`profiles.json`):** Profile objects store `proxy.user` and `proxy.pass` as unencrypted plain strings in `data/profiles.json`. Any process or non-privileged user with read access to the local user directory can extract these credentials.
2. **Plaintext Android Database Storage:** The Android implementation stores `proxyUser` and `proxyPass` in the unencrypted Room SQLite database (`profiles` table).
3. **In-Transit Cleartext Headers:** When connecting to HTTP upstream proxies, credentials are sent in the `Proxy-Authorization` header using HTTP Basic Authentication (`Basic <base64>`), which provides no confidentiality over unencrypted transport layers.
4. **Android Cleartext Traffic Permitted:** `AndroidManifest.xml` specifies `android:usesCleartextTraffic="true"`, allowing unencrypted HTTP connections across cellular/Wi-Fi interfaces.

## Relevant Code Areas & Components
- **[Profile Manager](../entities/profile_manager.md):** Serializes and loads `data/profiles.json`.
- **[Local Proxy Bridge](../entities/proxy_bridge.md):** Encodes and dispatches `Proxy-Authorization` credentials.
- **[Android Subsystem](../entities/android_subsystem.md):** Room DB entity `Profile.kt` and `AndroidManifest.xml`.

## Anti-Pattern Example (What NOT To Do)
```json
// DANGEROUS: Storing plain text credentials directly in configuration file
{
  "id": "profile-1",
  "proxy": {
    "enabled": true,
    "type": "http",
    "host": "198.51.100.1",
    "port": 8080,
    "user": "corp_admin",
    "pass": "SuperSecretPassword123!"
  }
}
```

## Defensive Architecture & Mitigations in Codebase
1. **OS Keyring Integration:** Recommended architectural enhancement is to leverage Electron's `safeStorage` API (`safeStorage.encryptString()` / `safeStorage.decryptString()`) on Windows to store encrypted credential tokens bound to the OS user account.
2. **Android EncryptedSharedPreferences / SQLCipher:** Utilize Android Jetpack Security or SQLCipher to encrypt sensitive database columns for proxy authentication.
3. **Strict Loopback Scoping:** The local proxy forwarder binds exclusively to `127.0.0.1`, mitigating local network packet sniffing of loopback proxy requests.
