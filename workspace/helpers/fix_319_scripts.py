"""Writer: update the desktop-creds + android-creds reproducers for post-fix state,
and add post-fix verifiers. Historical repros keep proving the baseline flaw;
verifiers prove the live fix."""
import pathlib

repo = pathlib.Path(r"C:\Users\milad\Desktop\private browser")
out = repo / "workspace" / "reproducers"

desktop_hist = '''"""
Historical reproducer: CWE-319 desktop plaintext credential storage (finding 79d91e01).
Proves the COMMITTED baseline wrote profiles verbatim (no encryptSecret).
Baseline read from the git object store; no live-tree writes.
Run: python workspace/reproducers/repro_79d91e01_desktop_creds.py
"""
import subprocess
repo = r'C:/Users/milad/Desktop/private browser'
base = subprocess.run(['git', 'show', '3969557:main.js'], cwd=repo, check=True,
                       capture_output=True).stdout.decode('utf-8')
assert 'fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles' in base, 'baseline shape changed'
assert 'function encryptSecret' not in base, 'baseline unexpectedly encrypted'
print('MANTIS_REACHED_ENTRYPOINT: saveProfiles -> PROFILES_FILE')
print('BASELINE: saveProfiles serialized proxy.password verbatim (vulnerable)')
print('REPRODUCED (historical baseline flaw confirmed)')
'''

desktop_verify = '''"""
Post-fix verifier for 79d91e01 (desktop half): live tree encrypts proxy
passwords on save, decrypts on load, gates safeStorage, and documents the
enc:v2: fallback as obfuscation-only.
Run: python workspace/reproducers/verify_79d91e01_desktop_fixed.py
"""
import sys
repo = r'C:/Users/milad/Desktop/private browser'
live = open(repo + '/main.js', encoding='utf-8').read()
checks = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    checks.append(cond)
check('saveProfiles encrypts password', 'password: encryptSecret(p.proxy.password)' in live)
check('saveProxies encrypts password', 'password: encryptSecret(prx.password)' in live)
check('loadProfiles decrypts on read', 'decryptSecret(p.proxy.password)' in live)
check('safeStorage gated on ready+available',
      'app.isReady()' in live and 'safeStorage.isEncryptionAvailable()' in live)
check('fallback documented as obfuscation-only', 'NOT a security boundary against local malware' in live)
check('fallback use is logged once', '_fallbackKeyWarningLogged' in live)
print('MANTIS_REACHED_ENTRYPOINT: verify saveProfiles -> encryptSecret -> PROFILES_FILE')
ok = all(checks)
print('VERIFY: ' + ('CLOSED (desktop half encrypted; fallback honestly labeled)' if ok else 'RESIDUAL REMAINS'))
sys.exit(0 if ok else 1)
'''

android_hist = '''"""
Historical evidence: Android plaintext proxyPass (finding 79d91e01, Android half).
Baseline read from git object store: Profile.kt declared a plaintext proxyPass
column with no encrypted store anywhere under app/src.
Run: python workspace/reproducers/repro_79d91e01_android_creds.py
"""
import re, subprocess
repo = r'C:/Users/milad/Desktop/private browser'
base = subprocess.run(['git', 'show', 'HEAD:app/src/main/java/com/jozmoz/privatebrowser/data/Profile.kt'],
                      cwd=repo, check=True, capture_output=True).stdout.decode('utf-8')
m = re.search(r'val proxyPass.*', base)
assert m, 'proxyPass field missing in baseline'
print('MANTIS_REACHED_ENTRYPOINT: Profile.kt Room entity proxyPass column (baseline)')
print('FIELD: ' + m.group(0).strip())
tree = subprocess.run(['git', 'ls-tree', '-r', '--name-only', 'HEAD', 'app/src'],
                      cwd=repo, check=True, capture_output=True).stdout.decode('utf-8')
assert not re.search(r'SQLCipher|EncryptedShared|ProxyCredentialStore', tree), 'baseline unexpectedly had crypto'
print('BASELINE: plaintext Room column, no encrypted store (vulnerable)')
print('REPRODUCED (historical baseline flaw confirmed)')
'''

android_verify = '''"""
Post-fix verifier for 79d91e01 (Android half): credentials moved to an
EncryptedSharedPreferences store with a keystore-backed key; Room columns
deprecated; migration copies + wipes plaintext on open.
Run: python workspace/reproducers/verify_79d91e01_android_fixed.py
"""
import sys
repo = r'C:/Users/milad/Desktop/private browser'
p = lambda rel: open(repo + '/' + rel, encoding='utf-8').read()
checks = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    checks.append(cond)
store = p('app/src/main/java/com/jozmoz/privatebrowser/data/ProxyCredentialStore.kt')
check('encrypted store exists (EncryptedSharedPreferences)',
      'EncryptedSharedPreferences.create' in store)
check('keystore-backed key (AES256_GCM)', 'AES256_GCM' in store)
check('per-profile save/get/clear API',
      'saveCredentials' in store and 'getPass' in store and 'clearCredentials' in store)
prof = p('app/src/main/java/com/jozmoz/privatebrowser/data/Profile.kt')
check('Room columns deprecated', '@Deprecated' in prof and 'ProxyCredentialStore' in prof)
db = p('app/src/main/java/com/jozmoz/privatebrowser/data/AppDatabase.kt')
check('DB version bumped (migration path)', 'version = 2' in db)
check('migration copies creds into encrypted store',
      'ProxyCredentialStore.saveCredentials' in db)
check('migration wipes plaintext columns',
      "SET proxyUser = '', proxyPass = ''" in db)
check('security-crypto dependency declared',
      'security-crypto' in p('app/build.gradle.kts'))
print('MANTIS_REACHED_ENTRYPOINT: verify Profile.kt -> ProxyCredentialStore -> AppDatabase migration')
ok = all(checks)
print('VERIFY: ' + ('CLOSED (Android creds encrypted at rest with migration)' if ok else 'RESIDUAL REMAINS'))
sys.exit(0 if ok else 1)
'''

(out / "repro_79d91e01_desktop_creds.py").write_text(desktop_hist, encoding="utf-8")
(out / "verify_79d91e01_desktop_fixed.py").write_text(desktop_verify, encoding="utf-8")
(out / "repro_79d91e01_android_creds.py").write_text(android_hist, encoding="utf-8")
(out / "verify_79d91e01_android_fixed.py").write_text(android_verify, encoding="utf-8")
print("wrote historical repros + post-fix verifiers for 79d91e01")
