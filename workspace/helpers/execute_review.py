import os
import json
from datetime import datetime, timezone
import append_review

FINDINGS_DIR = os.path.join(os.getcwd(), 'workspace', 'findings')

reviews = {
    "ad1e7679-6a59-4da3-b6da-14d234f8fa6e": {
        "status": "VALID",
        "reasoning": "Confirmed triggerable logic flaw in main.js:968 (safeRmSessionDirAsync) and main.js:2039 (profiles:delete). dir.startsWith(PROFILES_STORAGE_DIR) performs a substring check on raw un-normalized paths. Passing a crafted profileId with directory traversal sequences (e.g. `..\\\\..\\\\target`) satisfies the prefix check while causing fs.rmSync(dir, { recursive: true, force: true }) to resolve the traversal and delete arbitrary directories outside the profile root. The input is directly attacker-controlled via the profiles:delete and profiles:wipe IPC handlers.",
        "repro_hints": "Send an IPC invoke message `window.api.deleteProfile('..\\\\..\\\\test_dir')` after creating `data/test_dir`. Observe safeRmSessionDirAsync validating dir.startsWith(PROFILES_STORAGE_DIR) == true and subsequently deleting test_dir outside data/profiles_storage.",
        "triage_checklist": {
            "ignore_hypothetical_misuse": {"outcome": "PASS"},
            "ignore_missing_hygiene": {"outcome": "PASS"},
            "require_strict_reproducibility": {"outcome": "PASS"},
            "avoid_pedantic_linting": {"outcome": "PASS"},
            "no_security_flaw_stretching": {"outcome": "PASS"},
            "evaluate_questionable_file_paths": {"outcome": "PASS"},
            "ignore_resource_exhaustion_dos": {"outcome": "PASS"},
            "intrinsic_security_flaws": {"outcome": "PASS"},
            "verify_mitigations_pragmatically": {"outcome": "PASS"},
            "refine_code_paths_strictly": {"outcome": "PASS"},
            "ignore_simd_vector_padding": {"outcome": "PASS"},
            "ensure_source_code_coherence": {"outcome": "PASS"},
            "verify_attacker_control_of_source": {"outcome": "PASS"}
        }
    },
    "79d91e01-a9e8-4239-9e3c-9be1a80860bf": {
        "status": "VALID",
        "reasoning": "Confirmed in main.js:235 and Profile.kt:42. User-provided upstream proxy authentication passwords (profile.proxy.pass / proxyPass) are stored unencrypted in JSON format in data/profiles.json and in the Android Room SQLite database `profiles` table. Any local process or unprivileged user with read permissions can extract credentials in plaintext.",
        "repro_hints": "Create a profile with proxy credentials (`proxy.user: 'test', proxy.pass: 'Secret123'`). Inspect `data/profiles.json` and verify the password is saved in plaintext.",
        "triage_checklist": {
            "ignore_hypothetical_misuse": {"outcome": "PASS"},
            "ignore_missing_hygiene": {"outcome": "PASS"},
            "require_strict_reproducibility": {"outcome": "PASS"},
            "avoid_pedantic_linting": {"outcome": "PASS"},
            "no_security_flaw_stretching": {"outcome": "PASS"},
            "evaluate_questionable_file_paths": {"outcome": "PASS"},
            "ignore_resource_exhaustion_dos": {"outcome": "PASS"},
            "intrinsic_security_flaws": {"outcome": "PASS"},
            "verify_mitigations_pragmatically": {"outcome": "PASS"},
            "refine_code_paths_strictly": {"outcome": "PASS"},
            "ignore_simd_vector_padding": {"outcome": "PASS"},
            "ensure_source_code_coherence": {"outcome": "PASS"},
            "verify_attacker_control_of_source": {"outcome": "PASS"}
        }
    },
    "954da15f-b679-4b2e-b109-0b6868c2ddc5": {
        "status": "PROVISIONALLY_VALID",
        "reasoning": "Confirmed in main.js:2329. The ip:detect IPC handler dispatches an unencrypted HTTP GET request to `http://ip-api.com/json` over port 80. While the data retrieved is public geolocation telemetry, transmitting it in cleartext allows on-path eavesdroppers on public networks to monitor the lookup and potentially spoof location telemetry.",
        "repro_hints": "Invoke window.api.detectIpInfo(). Capture network traffic on port 80 with Wireshark to verify cleartext HTTP request and response packets.",
        "triage_checklist": {
            "ignore_hypothetical_misuse": {"outcome": "PASS"},
            "ignore_missing_hygiene": {"outcome": "PASS"},
            "require_strict_reproducibility": {"outcome": "PASS"},
            "avoid_pedantic_linting": {"outcome": "PASS"},
            "no_security_flaw_stretching": {"outcome": "PASS"},
            "evaluate_questionable_file_paths": {"outcome": "PASS"},
            "ignore_resource_exhaustion_dos": {"outcome": "PASS"},
            "intrinsic_security_flaws": {"outcome": "PASS"},
            "verify_mitigations_pragmatically": {"outcome": "PASS"},
            "refine_code_paths_strictly": {"outcome": "PASS"},
            "ignore_simd_vector_padding": {"outcome": "PASS"},
            "ensure_source_code_coherence": {"outcome": "PASS"},
            "verify_attacker_control_of_source": {"outcome": "PASS"}
        }
    },
    "ce282f66-f474-4080-a267-e55d37ed5473": {
        "status": "FALSE_POSITIVE",
        "reasoning": "Violates Rule 02 (Ignore Missing Hygiene / Defense-In-Depth) and Rule 04 (Avoid Pedantic Linting). Flagging `android:usesCleartextTraffic=\"true\"` is a generic static linter heuristic. In an anti-detect proxy browser, permitting cleartext HTTP traffic is an intended operational requirement to enable routing WebView traffic through unencrypted local or remote HTTP proxies.",
        "repro_hints": "",
        "triage_checklist": {
            "ignore_hypothetical_misuse": {"outcome": "PASS"},
            "ignore_missing_hygiene": {"outcome": "FAIL", "reason": "Flagging manifest usesCleartextTraffic is a missing defense-in-depth hygiene report, not an exploitable flaw."},
            "require_strict_reproducibility": {"outcome": "PASS"},
            "avoid_pedantic_linting": {"outcome": "FAIL", "reason": "Cleartext traffic is required by design to support local and remote HTTP proxy connections."},
            "no_security_flaw_stretching": {"outcome": "PASS"},
            "evaluate_questionable_file_paths": {"outcome": "PASS"},
            "ignore_resource_exhaustion_dos": {"outcome": "PASS"},
            "intrinsic_security_flaws": {"outcome": "PASS"},
            "verify_mitigations_pragmatically": {"outcome": "PASS"},
            "refine_code_paths_strictly": {"outcome": "PASS"},
            "ignore_simd_vector_padding": {"outcome": "PASS"},
            "ensure_source_code_coherence": {"outcome": "PASS"},
            "verify_attacker_control_of_source": {"outcome": "PASS"}
        }
    },
    "44c508d3-1d2e-4351-96f8-db36af603a8e": {
        "status": "FALSE_POSITIVE",
        "reasoning": "Violates Rule 02 (Ignore Missing Hygiene) and Rule 04 (Avoid Pedantic Linting). Chromium binary release archives are fetched over authenticated HTTPS/TLS from official GitHub releases. Claiming lack of secondary SHA-256 hash validation against an adversary already able to compromise TLS is missing defense-in-depth hygiene.",
        "repro_hints": "",
        "triage_checklist": {
            "ignore_hypothetical_misuse": {"outcome": "PASS"},
            "ignore_missing_hygiene": {"outcome": "FAIL", "reason": "Absence of secondary checksum validation on an HTTPS release download is missing defense-in-depth hygiene."},
            "require_strict_reproducibility": {"outcome": "PASS"},
            "avoid_pedantic_linting": {"outcome": "FAIL", "reason": "Standard HTTPS transport already provides authenticated transport layer encryption."},
            "no_security_flaw_stretching": {"outcome": "PASS"},
            "evaluate_questionable_file_paths": {"outcome": "PASS"},
            "ignore_resource_exhaustion_dos": {"outcome": "PASS"},
            "intrinsic_security_flaws": {"outcome": "PASS"},
            "verify_mitigations_pragmatically": {"outcome": "PASS"},
            "refine_code_paths_strictly": {"outcome": "PASS"},
            "ignore_simd_vector_padding": {"outcome": "PASS"},
            "ensure_source_code_coherence": {"outcome": "PASS"},
            "verify_attacker_control_of_source": {"outcome": "PASS"}
        }
    }
}

now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

for fid, r in reviews.items():
    fpath = os.path.join(FINDINGS_DIR, f"{fid}.json")
    if os.path.exists(fpath):
        append_review.append_review(
            finding_path=fpath,
            status=r["status"],
            reasoning=r["reasoning"],
            repro_hints=r.get("repro_hints", ""),
            triage_checklist_json=r["triage_checklist"],
            pass_number=1,
            timestamp=now_iso,
            snapshot=""
        )
    else:
        print(f"Warning: finding {fid} not found at {fpath}")

print("All reviews executed successfully.")
