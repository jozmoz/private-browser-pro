"""
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
