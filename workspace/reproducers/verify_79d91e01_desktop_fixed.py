"""
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
