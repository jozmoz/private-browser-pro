"""Stamp post-fix verification state onto the three live findings.

- Re-anchor code_paths to current live line numbers.
- Record reattack (traversal), verify scripts, and patch_status=VERIFIED_SECURE
  for the two findings whose fix is fully verifiable in this repo (traversal
  guard + TLS-only geo). The credential finding stays PATCHED (not VERIFIED):
  the Android half adds new files that cannot be compiled here (no Android SDK),
  so per policy it is MITIGATION_PROPOSED-equivalent -> keep PATCHED with an
  explicit note, do not claim VERIFIED_SECURE.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(r"C:\Users\milad\Desktop\private browser")
DIR = REPO / "workspace" / "findings"
NOW = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def load(name):
    p = DIR / name
    return json.loads(p.read_text(encoding="utf-8")), p


def push(d, stage, action, details):
    d.setdefault("history", []).append(
        {"stage": stage, "action": action, "details": details,
         "pass_number": 1, "snapshot": "", "timestamp": NOW}
    )


# --- ad1e7679: traversal containment hardened -> VERIFIED_SECURE ---
d, p = load("ad1e7679-6a59-4da3-b6da-14d234f8fa6e.json")
d["code_paths"] = ["main.js:1176", "main.js:2348", "main.js:1878"]
d["reattack_status"] = "failed_to_bypass"
d["reattack_file_path"] = "workspace/reproducers/reattack_ad1e7679_variants.py"
d["reattack_run_command"] = "python {TARGET_ROOT}/workspace/reproducers/reattack_ad1e7679_variants.py"
d["reattack_output"] = (
    "13/13 PASS: containment + root-equality + 6 IPC/profile gates; "
    "t1 posix, t2 backslash, t3 bare root, t4 empty, t5 dot, t6 sibling-prefix blocked; "
    "t7 legit child allowed. REATTACK: failed_to_bypass"
)
d["reattack_variants"] = [
    {"description": "posix traversal STORE/../../victim (path.join of malicious profileId)", "triggered": False},
    {"description": "windows backslash traversal STORE\\..\\..\\victim", "triggered": False},
    {"description": "bare storage root (empty profileId join)", "triggered": False},
    {"description": "empty string and dot directory", "triggered": False},
    {"description": "sibling-prefix trick STORE-evil/x (anchoring check)", "triggered": False},
    {"description": "legit child STORE/p1234_test-1 still deletable (functionality)", "triggered": False},
]
d["patch_status"] = "VERIFIED_SECURE"
push(d, "reattack", "reproduced",
     "Re-attack evaluated as failed_to_bypass (6 variants + 7 wiring checks, 13/13 PASS) after containment hardening.")
push(d, "patch", "verified",
     "Containment hardened (root-equality reject, case-insensitive anchoring, launchProfile/stopProfile gates); "
     "re-attack failed_to_bypass with 6 boundary variants.")
p.write_text(json.dumps(d, indent=2), encoding="utf-8")
print("ad1e7679 -> VERIFIED_SECURE, paths re-anchored")

# --- 79d91e01: desktop labeled + Android encrypted store; keep PATCHED ---
d, p = load("79d91e01-a9e8-4239-9e3c-9be1a80860bf.json")
d["code_paths"] = ["main.js:917", "app/src/main/java/com/jozmoz/privatebrowser/data/Profile.kt:42"]
d["repro_hints"] = (
    "Desktop: encryptSecret/decryptSecret with safeStorage gate; enc:v2: fallback now warns once and is "
    "documented as obfuscation-only (verify_79d91e01_desktop_fixed.py 6/6 PASS). Android: NEW "
    "ProxyCredentialStore.kt (EncryptedSharedPreferences, keystore AES256_GCM) + Profile.kt columns "
    "deprecated + AppDatabase v2 migration that copies creds into the encrypted store and wipes the "
    "plaintext columns (verify_79d91e01_android_fixed.py 8/8 PASS static). Android not compiled here "
    "(no SDK in this environment), so this stays PATCHED pending a Gradle build, not VERIFIED_SECURE."
)
push(d, "patch", "patched",
     "Post-fix verification: desktop 6/6 + Android static 8/8 PASS; Android awaits Gradle build for VERIFIED_SECURE.")
p.write_text(json.dumps(d, indent=2), encoding="utf-8")
print("79d91e01 -> PATCHED (Android awaits build), paths re-anchored")

# --- 954da15f: TLS-only fallback -> VERIFIED_SECURE ---
d, p = load("954da15f-b679-4b2e-b109-0b6868c2ddc5.json")
d["code_paths"] = ["main.js:2850", "main.js:2421"]
d["repro_status"] = "reproduced"
d["repro_file_path"] = "workspace/reproducers/repro_954da15f_ipdetect.py"
d["run_command"] = "python {TARGET_ROOT}/workspace/reproducers/repro_954da15f_ipdetect.py"
d["repro_output"] = (
    "MANTIS_REACHED_ENTRYPOINT: ip:detect -> http.get http://ip-api.com/json (pre-fix baseline 3969557) | "
    "LIVE: TLS-only geo lookups (residual closed by current fix)"
)
d["patch_status"] = "VERIFIED_SECURE"
push(d, "patch", "verified",
     "Cleartext fallback removed; resolveFallbackIpCountry now uses https://ipapi.co with fail-closed "
     "Unknown default (verify_954da15f_fixed.py 6/6 PASS; repo-wide grep for ip-api.com clean).")
p.write_text(json.dumps(d, indent=2), encoding="utf-8")
print("954da15f -> VERIFIED_SECURE, paths re-anchored")
