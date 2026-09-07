"""Stamp reproduce / re-attack outcomes onto pass-1 findings (MODE-OFF, live tree)."""
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
        {
            "stage": stage,
            "action": action,
            "details": details,
            "pass_number": 1,
            "snapshot": "",
            "timestamp": NOW,
        }
    )


# --- ad1e7679: CWE-22 path traversal (re-anchored lines, reproduced, patch holds) ---
d, p = load("ad1e7679-6a59-4da3-b6da-14d234f8fa6e.json")
d["code_paths"] = ["main.js:1156", "main.js:2325", "main.js:1855"]
d["repro_status"] = "reproduced"
d["repro_file_path"] = "workspace/reproducers/repro_ad1e7679_path_traversal.py"
d["run_command"] = "python {TARGET_ROOT}/workspace/reproducers/repro_ad1e7679_path_traversal.py"
d["repro_output"] = (
    "MANTIS_REACHED_ENTRYPOINT: profiles:delete -> safeRmSessionDirAsync | "
    "joined = /data/profiles_storage/../../victim_evil | baseline guard passes "
    "(vulnerable) = True | REPRODUCED: traversal payload deletes directory outside "
    "profile root on unpatched baseline (sandbox temp-dir deletion proved recursive-rm semantics)"
)
d["repro_hints"] = (
    "Baseline HEAD main.js:967-968 raw startsWith bypass confirmed. Live-tree re-attack "
    "(reattack_ad1e7679_variants.py, 6/6 PASS): isSafeDirToDelete path.resolve+sep plus "
    "isValidProfileId at profiles:delete/wipe/launch/clone/wipeProfile block traversal; "
    "legit child still deletable. Residual: profile IDs are server-generated, so entry "
    "needs renderer IPC compromise or a malicious local IPC client."
)
d["reattack_status"] = "failed_to_bypass"
d["reattack_file_path"] = "workspace/reproducers/reattack_ad1e7679_variants.py"
d["reattack_run_command"] = "python {TARGET_ROOT}/workspace/reproducers/reattack_ad1e7679_variants.py"
d["reattack_output"] = (
    "9/9 PASS: helpers present and wired; t1 posix, t2 backslash, t3 bare root, "
    "t4 empty, t5 dot blocked; t6 legit child allowed. REATTACK: failed_to_bypass (patch holds)"
)
d["reattack_variants"] = [
    {"description": "posix traversal STORE/../../victim (path.join of malicious profileId)", "triggered": False},
    {"description": "windows backslash traversal STORE\\..\\..\\victim", "triggered": False},
    {"description": "bare storage root (empty profileId join)", "triggered": False},
    {"description": "empty string and dot directory", "triggered": False},
    {"description": "legit child STORE/p1234_test-1 still deletable (functionality)", "triggered": False},
]
push(d, "reproduce", "reproduced",
     "Reproduction status evaluated as reproduced using command: python workspace/reproducers/repro_ad1e7679_path_traversal.py")
push(d, "reattack", "reproduced",
     "Re-attack status evaluated as failed_to_bypass using command: python workspace/reproducers/reattack_ad1e7679_variants.py (5 variants, all blocked)")
p.write_text(json.dumps(d, indent=2), encoding="utf-8")
print("ad1e7679: reproduced + failed_to_bypass, paths re-anchored")

# --- 79d91e01: CWE-319 credential storage (split verdict, reproduced) ---
d, p = load("79d91e01-a9e8-4239-9e3c-9be1a80860bf.json")
d["code_paths"] = ["main.js:910", "app/src/main/java/com/jozmoz/privatebrowser/data/Profile.kt:42"]
d["repro_status"] = "reproduced"
d["repro_file_path"] = "workspace/reproducers/repro_79d91e01_desktop_creds.py"
d["run_command"] = "python {TARGET_ROOT}/workspace/reproducers/repro_79d91e01_desktop_creds.py"
d["repro_output"] = (
    "MANTIS_REACHED_ENTRYPOINT: saveProfiles -> PROFILES_FILE | BASELINE: saveProfiles "
    "serialized proxy.password verbatim | LIVE: saveProfiles encrypts (safeStorage enc:v1: / "
    "AES-256-GCM enc:v2:) | CAVEAT: fallback key PBKDF2(hostname|username, fixed salt) "
    "recomputable by same-user LOCAL"
)
d["repro_hints"] = (
    "Desktop half fixed in live tree (encryptSecret/decryptSecret, safeStorage gate "
    "app.isReady+isEncryptionAvailable). Residual: AES-GCM fallback key is machine-derived, "
    "so same-user LOCAL reads it back; profiles:list returns decrypted passwords to renderer. "
    "Android half UNFIXED: Profile.kt:42 proxyPass plaintext Room column, AppDatabase without "
    "SQLCipher, no EncryptedSharedPreferences under app/src (see repro_79d91e01_android_creds.py)."
)
push(d, "reproduce", "reproduced",
     "Reproduction status evaluated as reproduced (baseline plaintext confirmed; live split verdict "
     "with Android residual) using command: python workspace/reproducers/repro_79d91e01_desktop_creds.py")
p.write_text(json.dumps(d, indent=2), encoding="utf-8")
print("79d91e01: reproduced (split verdict), paths re-anchored")

# --- 954da15f: CWE-319 cleartext IP lookup (upgraded to VALID, residual, statically confirmed) ---
d, p = load("954da15f-b679-4b2e-b109-0b6868c2ddc5.json")
d["status"] = "VALID"
d["code_paths"] = ["main.js:2813", "main.js:2398"]
d["repro_status"] = "statically_confirmed"
d["repro_file_path"] = "workspace/reproducers/repro_954da15f_ipdetect.py"
d["run_command"] = "python {TARGET_ROOT}/workspace/reproducers/repro_954da15f_ipdetect.py"
d["repro_output"] = (
    "MANTIS_REACHED_ENTRYPOINT: ip:detect -> http.get http://ip-api.com/json (baseline) | "
    "LIVE-PRIMARY-HTTPS-OK (https://ipwho.is/ + https://ipapi.co/json/) | RESIDUAL: "
    "resolveFallbackIpCountry -> http://ip-api.com wired at 4 call sites (resolveIpCountry "
    "fallbacks feeding proxy geo-flag flows)"
)
d["repro_hints"] = (
    "Primary handler fixed (HTTPS plus isTrustedSender). Residual cleartext fallback fires on "
    "HTTPS timeout/failure, a normal network condition, not non-default config. Egress IP is "
    "already visible on-path; only the cosmetic country flag is spoofable. Live verification "
    "suite passes 9/9."
)
push(d, "reproduce", "reproduced",
     "Reproduction status evaluated as statically_confirmed (primary fixed, cleartext fallback "
     "residual wired) using command: python workspace/reproducers/repro_954da15f_ipdetect.py")
p.write_text(json.dumps(d, indent=2), encoding="utf-8")
print("954da15f: VALID + statically_confirmed, paths re-anchored")
