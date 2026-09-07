import os
import re
import json
import uuid
import hashlib
from datetime import datetime, timezone

FINDINGS_DIR = os.path.join(os.getcwd(), 'workspace', 'findings')
os.makedirs(FINDINGS_DIR, exist_ok=True)

findings_data = [
    {
        "title": "Path Traversal and Arbitrary Directory Deletion in safeRmSessionDirAsync",
        "cwe": "CWE-22",
        "description": "In main.js, safeRmSessionDirAsync() and safeRmSessionDir() attempt to prevent directory traversal by validating whether `dir.startsWith(SESSIONS_DIR)` or `dir.startsWith(PROFILES_STORAGE_DIR)`. However, `dir` is checked as a raw un-normalized string without resolving path segments via `path.resolve(dir)`. In handlers such as `profiles:delete` (line 2039) and `profiles:wipe` (line 1657), `path.join(PROFILES_STORAGE_DIR, profileId)` is passed directly to `safeRmSessionDirAsync`. An attacker or malicious IPC payload providing a profile ID containing directory traversal sequences (e.g. `..\\..\\sensitive_dir`) satisfies the `startsWith` prefix condition while targeting directories outside the intended profile storage root. When `fs.rmSync(dir, { recursive: true, force: true })` executes, Node.js normalizes the traversal path and recursively erases the arbitrary directory.",
        "impact": "Arbitrary recursive directory deletion across the host filesystem, resulting in catastrophic user data destruction.",
        "severity": "HIGH",
        "privileges_required": "LOW",
        "attacker_position": "LOCAL",
        "user_interaction": "NONE",
        "code_paths": [
            "main.js:968",
            "main.js:2039",
            "main.js:1657"
        ],
        "mitigation": "Resolve the canonical path with `path.resolve(dir)` and verify that it strictly begins with `path.resolve(PROFILES_STORAGE_DIR) + path.sep` or `path.resolve(SESSIONS_DIR) + path.sep`. Additionally, validate profile IDs with a strict alphanumeric/UUID regex (`/^[a-zA-Z0-9_-]+$/`) to reject any path traversal characters."
    },
    {
        "title": "Plaintext Storage of Upstream Proxy Passwords in Local Configuration Files",
        "cwe": "CWE-319",
        "description": "In main.js, saveProfiles() serializes all profile metadata directly to `data/profiles.json` (or `userData/profiles.json`) using unencrypted JSON format. When a profile is configured with upstream proxy authentication, the plain password is saved in `profile.proxy.pass` without cryptographic protection. Similarly, in the companion Android subsystem (Profile.kt:42), `proxyPass` is stored as an unencrypted column in the Room SQLite database. Any local process, non-privileged user, or forensic tool with read access to the user's data directory can extract plaintext upstream proxy credentials.",
        "impact": "Exposure of sensitive proxy authentication credentials, allowing credential reuse and unauthorized proxy tunneling.",
        "severity": "MEDIUM",
        "privileges_required": "LOW",
        "attacker_position": "LOCAL",
        "user_interaction": "NONE",
        "code_paths": [
            "main.js:235",
            "app/src/main/java/com/jozmoz/privatebrowser/data/Profile.kt:42"
        ],
        "mitigation": "Encrypt proxy credentials at rest using Electron's `safeStorage` API (`safeStorage.encryptString()`) on desktop, and Jetpack Security `EncryptedSharedPreferences` or SQLCipher on Android."
    },
    {
        "title": "Cleartext HTTP Transmission and Eavesdropping in IP Detection API",
        "cwe": "CWE-319",
        "description": "In main.js, the `ip:detect` IPC handler dispatches an unencrypted outbound HTTP GET request to `http://ip-api.com/json` on port 80. Cleartext HTTP requests transmit the user's IP lookup request and receive location, country, city, and ISP metadata without transport layer security (TLS). Eavesdroppers on the local network (e.g. public Wi-Fi) or malicious ISPs can intercept, monitor, or spoof the geolocation telemetry returned to the application.",
        "impact": "Network eavesdropping and potential Man-in-the-Middle (MITM) spoofing of IP and geographic location telemetry.",
        "severity": "LOW",
        "privileges_required": "NONE",
        "attacker_position": "EXTERNAL",
        "user_interaction": "NONE",
        "code_paths": [
            "main.js:2329"
        ],
        "mitigation": "Enforce HTTPS by querying `https://ip-api.com/json` (or a secure TLS endpoint such as `https://api.ipify.org?format=json`) utilizing the `https` module."
    },
    {
        "title": "Unrestricted Cleartext Network Traffic Permitted in Android Application Manifest",
        "cwe": "CWE-319",
        "description": "In app/src/main/AndroidManifest.xml, the application sets `android:usesCleartextTraffic=\"true\"`. This configuration disables Android's default Network Security Config protections (enforced since Android 9 / API 28) which require HTTPS for all network operations. Consequently, WebViews and network connections within the application are permitted to transmit sensitive HTTP credentials and cookies in cleartext without TLS.",
        "impact": "In-transit traffic interception and credential harvesting over unencrypted Wi-Fi and mobile networks.",
        "severity": "LOW",
        "privileges_required": "NONE",
        "attacker_position": "EXTERNAL",
        "user_interaction": "NONE",
        "code_paths": [
            "app/src/main/AndroidManifest.xml:17"
        ],
        "mitigation": "Set `android:usesCleartextTraffic=\"false\"` or configure a dedicated `network_security_config.xml` defining cleartext exceptions strictly for specific loopback proxies."
    },
    {
        "title": "Missing Cryptographic Digest Verification on Downloaded Chromium Archive",
        "cwe": "CWE-494",
        "description": "In main.js, downloadChromium() downloads portable Ungoogled Chromium zip packages from public release URLs and third-party mirrors (`download-chromium.appspot.com`). Once downloaded, the archive is immediately unzipped into `data/chromium/` and executed without verifying its SHA-256 hash or digital signature against a trusted digest. If a mirror is compromised or DNS hijacking occurs during download, arbitrary malicious binaries could be downloaded and executed as `chrome.exe`.",
        "impact": "Remote code execution if a mirror or download source is tampered with or intercepted.",
        "severity": "MEDIUM",
        "privileges_required": "NONE",
        "attacker_position": "EXTERNAL",
        "user_interaction": "REQUIRED",
        "code_paths": [
            "main.js:1845",
            "main.js:1863"
        ],
        "mitigation": "Fetch and verify official SHA-256 checksums from GitHub release assets before extracting and executing downloaded archives."
    }
]

now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

created_ids = []
for item in findings_data:
    finding_id = str(uuid.uuid4())
    norm_title = re.sub(r'[^a-zA-Z0-9]', '', item['title']).lower()
    cwe_part = item.get('cwe', '')
    primary_target = item['code_paths'][0].split(':')[0] if item['code_paths'] else ''
    sig_raw = f"{norm_title}|{cwe_part}|{primary_target}"
    signature = hashlib.sha256(sig_raw.encode('utf-8')).hexdigest()[:16]
    lineage_id = str(uuid.uuid4())

    finding_obj = {
        "id": finding_id,
        "title": item["title"],
        "description": item["description"],
        "impact": item["impact"],
        "severity": item["severity"],
        "privileges_required": item["privileges_required"],
        "attacker_position": item["attacker_position"],
        "user_interaction": item["user_interaction"],
        "status": "PROVISIONALLY_VALID",
        "code_paths": item["code_paths"],
        "cwe": item["cwe"],
        "signature": signature,
        "lineage_id": lineage_id,
        "mitigation": item["mitigation"],
        "history": [
            {
                "stage": "researcher",
                "action": "created",
                "details": "Initial audit finding recorded from plan investigation.",
                "pass_number": 1,
                "timestamp": now_iso
            }
        ]
    }

    out_file = os.path.join(FINDINGS_DIR, f"{finding_id}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(finding_obj, f, indent=2)
    created_ids.append(finding_id)

print(f"Generated {len(created_ids)} findings in workspace/findings/")
for fid in created_ids:
    print(f" - {fid}")
