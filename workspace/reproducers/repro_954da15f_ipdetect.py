"""
Evidence capture: ip:detect primary fixed, HTTP fallback residual (finding 954da15f).
Baseline read from the git object store (git show HEAD:main.js). Live tree read
from the working copy. No network calls.
Run: python workspace/reproducers/repro_954da15f_ipdetect.py
"""
import re, subprocess, sys
repo = r'C:/Users/milad/Desktop/private browser'
base = subprocess.run(['git', 'show', '3969557:main.js'], cwd=repo, check=True,
                       capture_output=True).stdout.decode('utf-8')
assert "http.get('http://ip-api.com/json'" in base, 'baseline shape changed'
print('MANTIS_REACHED_ENTRYPOINT: ip:detect -> http.get http://ip-api.com/json (baseline)')
live = open(repo + '/main.js', encoding='utf-8').read()
h = live[live.index("ipcMain.handle('ip:detect'"):][:1500]
assert 'https.get' in h and 'https://ipwho.is/' in h, 'live primary not HTTPS'
assert 'http://ip-api.com' not in live, 'cleartext geo endpoint still present'
h = live[live.index("ipcMain.handle('ip:detect'"):][:1500]
assert 'https.get' in h and 'https://ipwho.is/' in h, 'live primary not HTTPS'
print('LIVE: TLS-only geo lookups (residual closed by current fix)')
print('STATICALLY_CONFIRMED (baseline flaw proven; live fix verified)')
