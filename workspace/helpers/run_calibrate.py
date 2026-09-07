"""Calibrate the three live findings (MODE-OFF: no active_snapshot, no STALE_EVIDENCE).

Formulas (per mantis-calibrate):
  Hazard = (Impact + Likelihood) * ContextMultiplier  [capped 10.0]
  - ad1e7679 (CWE-22 traversal): I=2 (single-user data only, per Impact-2 MUST-NOT-EXCEED rule),
    L=4 (functional PoC: baseline guard bypass + sandbox deletion), mult=0.8 (LOCAL->INTERNAL).
    (2+4)*0.8 = 4.8 MEDIUM. Caps: local_attack_vector + self_contained_blast + internal_nested
    (all MEDIUM 5.9, non-binding).
  - 79d91e01 (CWE-319 creds): I=3 (LOW-priv cap; creds reusable against external proxy
    service + victim attribution), L=3 (trivial file/DB read, reproduced), mult=0.8.
    (3+3)*0.8 = 4.8 MEDIUM. Caps: local_attack_vector + internal_nested (non-binding);
    self_contained_blast DNA (crosses to third-party resources).
  - 954da15f (CWE-319 residual HTTP): I=1 (cosmetic flag / negligible), L=3 (static cap),
    mult=1.0 (EXTERNAL->EXPOSED) * 0.8 static_confirmation = (1+3)*1.0*0.8 = 3.2 MEDIUM.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(r"C:\Users\milad\Desktop\private browser")
NOW = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

DNA = "DOES_NOT_APPLY"


def chk(outcome, reason=None):
    return {"outcome": outcome, **({"reason": reason} for _ in [0] if False)} if False else (
        {"outcome": outcome} if outcome == DNA and reason is None
        else {"outcome": outcome, "reason": reason}
    )


def base_checklist():
    return {
        "repro_failure": {"outcome": DNA},
        "unreachable_inputs": {"outcome": DNA},
        "third_party_reachability": {"outcome": DNA},
        "minor_config_hygiene": {"outcome": DNA},
        "non_security_critical": {"outcome": DNA},
        "vague_code_paths": {"outcome": DNA},
        "unreliable_triggers": {"outcome": DNA},
        "prerequisite_shell": {"outcome": DNA},
        "physical_long_term": {"outcome": DNA},
        "trusted_controller_zero_delta": {"outcome": DNA},
        "standard_host_attacks": {"outcome": DNA},
        "static_confirmation": {"outcome": DNA},
        "strict_xss": {"outcome": DNA},
        "internal_nested": {"outcome": DNA},
        "probabilistic_llm": {"outcome": DNA},
        "supply_chain_prerequisites": {"outcome": DNA},
        "non_default_config": {"outcome": DNA},
        "confidential_computing_host": {"outcome": DNA},
        "trusted_controller_critical_bypass": {"outcome": DNA},
        "local_attack_vector": {"outcome": DNA},
        "self_contained_blast": {"outcome": DNA},
        "rarely_exposed": {"outcome": DNA},
        "equivalent_primitives": {"outcome": DNA},
        "documented_insecure_config": {"outcome": DNA},
        "physical_temporary": {"outcome": DNA},
        "high_privilege_external": {"outcome": DNA},
        "trusted_controller_standard_bypass": {"outcome": DNA},
    }


CALIBRATIONS = {
    "ad1e7679-6a59-4da3-b6da-14d234f8fa6e": {
        "impact_score": 2,
        "likelihood_score": 4,
        "availability_tier": None,
        "inferred_exposure": "INTERNAL",
        "mantis_risk_score": 4.8,
        "priority": "MEDIUM",
        "sanity_triage_applied": "Local Attack Vector; Self-Contained Blast Radius; Internal/Nested",
        "outrage_commentary": "Outrage is low: a local-only file-deletion primitive in a single-user desktop app "
            "draws little external attention, and the live tree already carries the fix (uncommitted). "
            "The outrage-relevant angle is trust: users of an anti-detect browser assume strict renderer "
            "isolation, so a renderer-to-host deletion escape would damage confidence disproportionate to "
            "its technical score. Risk = Hazard (4.8) + low outrage; no numerical adjustment.",
        "executive_summary": "Unpatched, a renderer-compromised or malicious-local IPC caller could delete "
            "arbitrary user directories via crafted profile IDs (baseline guard bypass proven). The live "
            "working tree already blocks all tested traversal variants (path.resolve + separator-anchored "
            "containment plus strict profile-ID allowlist at every IPC entry), but the fix is uncommitted. "
            "Commit the patch; risk is MEDIUM because impact is confined to the single user's own data.",
    },
    "79d91e01-a9e8-4239-9e3c-9be1a80860bf": {
        "impact_score": 3,
        "likelihood_score": 3,
        "availability_tier": None,
        "inferred_exposure": "INTERNAL",
        "mantis_risk_score": 4.8,
        "priority": "MEDIUM",
        "sanity_triage_applied": "Local Attack Vector; Internal/Nested",
        "outrage_commentary": "Outrage is moderate: proxy credentials are the exact asset privacy-tool users "
            "pay for and assume are protected; a plaintext credential store (especially the wholly unencrypted "
            "Android Room database) would read as negligence if disclosed. No evidence of external exposure, "
            "so outrage stays reputational rather than incident-driven. Risk = Hazard (4.8) + moderate outrage; "
            "no numerical adjustment.",
        "executive_summary": "Split verdict: the desktop store now encrypts (safeStorage with an AES-256-GCM "
            "machine-keyed fallback), but the fallback key is recomputable by any same-user process and the "
            "Android Room database still holds proxyPass in plaintext with no SQLCipher or encrypted prefs. "
            "Encrypt the Android store (SQLCipher / EncryptedSharedPreferences) and treat the desktop fallback "
            "as obfuscation, not a boundary. MEDIUM.",
    },
    "954da15f-b679-4b2e-b109-0b6868c2ddc5": {
        "impact_score": 1,
        "likelihood_score": 3,
        "availability_tier": None,
        "inferred_exposure": "EXPOSED",
        "mantis_risk_score": 3.2,
        "priority": "MEDIUM",
        "sanity_triage_applied": "Static Confirmation (Static Evidence Only)",
        "outrage_commentary": "Outrage is negligible: a sporadic cleartext geo lookup that leaks nothing beyond "
            "what the network already sees, in a feature (auto-detect display flag) no user relies on for "
            "safety. Fixing it is hygiene for a privacy-branded product, not incident response. "
            "Risk = Hazard (3.2) + negligible outrage; no numerical adjustment.",
        "executive_summary": "The main IP-detect handler is fixed (HTTPS-only endpoints), but a cleartext HTTP "
            "fallback (resolveFallbackIpCountry -> http://ip-api.com) remains wired into four geo-flag call "
            "sites and fires whenever the primary HTTPS lookup fails. Impact is cosmetic (spoofable country "
            "flag; the egress IP is already visible on-path). Replace the fallback with an HTTPS endpoint or "
            "fail closed. Borderline MEDIUM (3.2).",
    },
}

REASONS = {
    "ad1e7679-6a59-4da3-b6da-14d234f8fa6e": {
        "internal_nested": "INTERNAL exposure (0.8): IPC-gated flaw, LOCAL position; score below CRITICAL so the 7.9 cap is non-binding.",
        "local_attack_vector": "Entry is LOCAL (renderer IPC compromise or malicious local IPC client); cap MEDIUM 5.9, non-binding at 4.8.",
        "self_contained_blast": "From the declared LOCAL position, deletion is confined to the user's own data; cap MEDIUM 5.9, non-binding. (Renderer-entry sandbox-escape nuance documented in critic reasoning.)",
        "prerequisite_shell": "Does not fire: the renderer-IPC entry needs no shell (sandboxed renderer gains an fs-deletion primitive it lacks under sandbox:true).",
        "equivalent_primitives": "Does not fire for the same reason: sandboxed renderer has no file-deletion primitive today.",
        "vague_code_paths": "Does not fire: code paths re-anchored to live lines (1156/2325/1855) and read directly.",
    },
    "79d91e01-a9e8-4239-9e3c-9be1a80860bf": {
        "internal_nested": "INTERNAL exposure (0.8): local file/DB read, LOCAL position; below CRITICAL so the 7.9 cap is non-binding.",
        "local_attack_vector": "Requires LOCAL read access to the user data dir or app database; cap MEDIUM 5.9, non-binding at 4.8.",
        "self_contained_blast": "Does not fire: stolen proxy credentials are usable from anywhere (proxy-account abuse, victim-attributed egress) and reach third-party service resources.",
        "prerequisite_shell": "Does not fire: file read grants the attacker a remotely-usable secret it did not possess.",
        "equivalent_primitives": "Does not fire: the attacker principal does not know the secret; only the victim typed it.",
        "non_security_critical": "Does not fire: proxy passwords are authentication secrets, not public data.",
    },
    "954da15f-b679-4b2e-b109-0b6868c2ddc5": {
        "static_confirmation": "APPLIES: statically_confirmed (primary fix + wired residual verified by executed reachability scripts, no packet trace); likelihood capped at 3 with 0.8 Hazard multiplier, not CRITICAL.",
        "internal_nested": "Does not fire: attacker_position EXTERNAL forces EXPOSED (1.0) per the alignment rule.",
        "local_attack_vector": "Does not fire: network-position attacker, no local access needed.",
        "self_contained_blast": "Does not fire: passive on-path collection gives the observer victim usage data beyond its own resources.",
        "non_default_config": "Does not fire: the fallback fires on ordinary HTTPS timeout/failure, a normal network condition.",
        "minor_config_hygiene": "Does not fire: concrete passive-sniff/MITM-spoof path demonstrated, not a pathless hygiene note.",
    },
}


def main():
    for fid, cal in CALIBRATIONS.items():
        cmd = [sys.executable, str(REPO / "workspace" / "helpers" / "append_calibrate.py"), fid, json.dumps({
            **cal,
            "attacker_position": json.loads((REPO / "workspace" / "findings" / (fid + ".json")).read_text(encoding="utf-8")).get("attacker_position", "LOCAL"),
            "calibration_checklist": {k: ({"outcome": "APPLIES", "reason": REASONS[fid][k]} if k in REASONS[fid] and v["outcome"] == "APPLIES" else
                                          ({"outcome": v["outcome"], "reason": REASONS[fid][k]} if k in REASONS[fid] else v))
                                      for k, v in {**base_checklist(), **{rk: {"outcome": "APPLIES"} for rk in REASONS[fid] if rk in (
                                          ("internal_nested", "local_attack_vector", "self_contained_blast", "static_confirmation"))}}.items()},
            "history_entry": {"stage": "calibrate", "action": "calibrated",
                              "details": "Calculated risk score as %s and priority as %s." % (cal["mantis_risk_score"], cal["priority"]),
                              "pass_number": 1, "timestamp": NOW},
        })]
        r = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True)
        print(r.stdout.strip() or r.stderr.strip())


if __name__ == "__main__":
    main()
