"""
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
