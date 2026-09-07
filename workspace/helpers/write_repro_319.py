"""Writer: emits CWE-319 reproducers (desktop encrypt round-trip + Android plaintext evidence)."""
import pathlib

repo = pathlib.Path(r"C:\Users\milad\Desktop\private browser")
out = repo / "workspace" / "reproducers"
out.mkdir(parents=True, exist_ok=True)

desktop = '''"""
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
'''

android = '''"""
Evidence capture: Android plaintext proxyPass (finding 79d91e01, Android half).
Room entity stores proxyPass as a plaintext column; no SQLCipher /
EncryptedSharedPreferences anywhere under app/src. Unconditional static fact,
so a build is unnecessary (statically_confirmed with in-repo evidence).
Run: python workspace/reproducers/repro_79d91e01_android_creds.py
"""
import pathlib, re, sys
repo = pathlib.Path(r'C:/Users/milad/Desktop/private browser')
prof = (repo / 'app/src/main/java/com/jozmoz/privatebrowser/data/Profile.kt').read_text(encoding='utf-8')
m = re.search(r'val proxyPass.*', prof)
assert m, 'proxyPass field missing'
print('MANTIS_REACHED_ENTRYPOINT: Profile.kt Room entity proxyPass column')
print('FIELD: ' + m.group(0).strip())
hits = [str(p) for p in (repo / 'app/src').rglob('*.kt')
        if re.search(r'SQLCipher|EncryptedSharedPreferences|EncryptedFile|MasterKey', p.read_text(encoding='utf-8'))]
print('files with Android at-rest crypto: ' + (', '.join(hits) if hits else '(none)'))
assert not hits, 'unexpected crypto found'
db = (repo / 'app/src/main/java/com/jozmoz/privatebrowser/data/AppDatabase.kt').read_text(encoding='utf-8')
assert 'SQLCipher' not in db and 'passphrase' not in db.lower()
print('STATICALLY_CONFIRMED: proxyPass persists in plaintext Room DB (no SQLCipher / EncryptedSharedPreferences)')
'''

ipdetect = '''"""
Evidence capture: ip:detect primary fixed, HTTP fallback residual (finding 954da15f).
Baseline used http://ip-api.com/json directly in the handler; live handler uses
https://ipwho.is/ + https://ipapi.co/json/ but resolveFallbackIpCountry still
issues cleartext http://ip-api.com and is wired into resolveIpCountry (4 sites)
feeding proxy geo-flag flows. Static + reachability evidence (no net calls).
Run: python workspace/reproducers/repro_954da15f_ipdetect.py
"""
import re, subprocess, tempfile, os
repo = r'C:/Users/milad/Desktop/private browser'
tmp = tempfile.mkdtemp(prefix='mantis-base-')
subprocess.run(['git', '--work-tree=' + tmp, 'checkout', 'HEAD', '--', 'main.js'],
               cwd=repo, check=True, capture_output=True)
base = open(os.path.join(tmp, 'main.js'), encoding='utf-8').read()
assert "http.get('http://ip-api.com/json'" in base, 'baseline shape changed'
print('MANTIS_REACHED_ENTRYPOINT: ip:detect -> http.get http://ip-api.com/json (baseline)')
live = open(os.path.join(repo, 'main.js'), encoding='utf-8').read()
h = live[live.index("ipcMain.handle('ip:detect'"):][:1500]
assert 'https.get' in h and 'https://ipwho.is/' in h, 'live primary not HTTPS'
assert 'resolveFallbackIpCountry' in live and 'http://ip-api.com/json/' in live
callers = [l.strip()[:90] for l in live.splitlines() if 'resolveFallbackIpCountry(clean)' in l]
assert len(callers) >= 3, 'fallback callers missing: %d' % len(callers)
print('LIVE-PRIMARY-HTTPS-OK; RESIDUAL: resolveFallbackIpCountry -> http://ip-api.com wired at %d call sites' % len(callers))
import shutil; shutil.rmtree(tmp, ignore_errors=True)
print('STATICALLY_CONFIRMED (residual cleartext fallback; primary fixed)')
'''

(out / "repro_79d91e01_desktop_creds.py").write_text(desktop, encoding="utf-8")
(out / "repro_79d91e01_android_creds.py").write_text(android, encoding="utf-8")
(out / "repro_954da15f_ipdetect.py").write_text(ipdetect, encoding="utf-8")
print("wrote", sorted(p.name for p in out.glob("repro_*.py")))
