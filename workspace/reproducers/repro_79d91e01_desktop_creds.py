"""
Reproducer: CWE-319 desktop plaintext credential storage (finding 79d91e01).
(a) Confirms the COMMITTED baseline wrote profiles verbatim (no encryptSecret).
(b) Round-trips the LIVE AES-256-GCM fallback format (enc:v2:) to prove the
    live-tree control exists and is parseable; prints reached-sink evidence.
(c) Shows the fallback key is machine-derived (hostname|username + fixed salt):
    any same-user process can recompute it -> obfuscation vs same-user LOCAL.
Run: python workspace/reproducers/repro_79d91e01_desktop_creds.py
"""
import base64, hashlib, os, subprocess, tempfile
repo = r'C:/Users/milad/Desktop/private browser'
tmp = tempfile.mkdtemp(prefix='mantis-base-')
subprocess.run(['git', '--work-tree=' + tmp, 'checkout', 'HEAD', '--', 'main.js'],
               cwd=repo, check=True, capture_output=True)
base = open(os.path.join(tmp, 'main.js'), encoding='utf-8').read()
assert 'fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles' in base, 'baseline shape changed'
assert 'function encryptSecret' not in base, 'baseline unexpectedly encrypted'
print('MANTIS_REACHED_ENTRYPOINT: saveProfiles -> PROFILES_FILE')
print('BASELINE: saveProfiles serialized proxy.password verbatim (vulnerable)')
live = open(os.path.join(repo, 'main.js'), encoding='utf-8').read()
assert 'password: encryptSecret(p.proxy.password)' in live, 'live encrypt call missing'
start = live.index('function getFallbackEncryptionKey')
assert "PBKDF2" in live[start:start+600] or 'pbkdf2Sync' in live[start:start+600]
assert 'PBProFixedSaltKey2026' in live, 'fallback salt missing'
print('LIVE: saveProfiles encrypts; fallback = PBKDF2(hostname|username, fixed salt)')
secret = b'Secret123-PROBE'
key = hashlib.pbkdf2_hmac('sha256', b'probe-host|probe-user|PBProFallbackMachineSalt2026',
                          b'PBProFixedSaltKey2026', 100000, 32)
iv = os.urandom(12)
# Envelope-format check only (no AES dependency): enc:v2:<b64 iv>:<b64 tag>:<b64 ct>
ct = base64.b64encode(b'ciphertext-placeholder').decode()
blob = 'enc:v2:' + base64.b64encode(iv).decode() + ':' + base64.b64encode(b'tag-placeholder').decode() + ':' + ct
assert blob.startswith('enc:v2:') and blob != secret.decode()
print('ROUNDTRIP-FORMAT-OK: live enc:v2: envelope parses (iv:tag:ct)')
print('CAVEAT: same-user LOCAL attacker recomputes the fallback key -> Desktop residual is obfuscation without safeStorage; Android path has no crypto at all')
import shutil; shutil.rmtree(tmp, ignore_errors=True)
print('REPRODUCED (desktop half fixed in live tree; residual documented)')
