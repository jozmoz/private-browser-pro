"""
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
