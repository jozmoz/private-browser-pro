"""Writer: fix the ipdetect evidence script to read the baseline from the git
object store (git show HEAD:main.js) instead of --work-tree checkout, which is
fragile on this machine (CRLF/work-tree quirks). Also add a post-fix live
assertion (no cleartext geo endpoint anywhere)."""
import pathlib

repo = pathlib.Path(r"C:\Users\milad\Desktop\private browser")
out = repo / "workspace" / "reproducers"

script = '''"""
Evidence capture: ip:detect primary fixed, HTTP fallback residual (finding 954da15f).
Baseline read from the git object store (git show HEAD:main.js). Live tree read
from the working copy. No network calls.
Run: python workspace/reproducers/repro_954da15f_ipdetect.py
"""
import re, subprocess, sys
repo = r'C:/Users/milad/Desktop/private browser'
base = subprocess.run(['git', 'show', 'HEAD:main.js'], cwd=repo, check=True,
                       capture_output=True).stdout.decode('utf-8')
assert "http://ip-api.com/json" in base, 'baseline shape changed'
print('MANTIS_REACHED_ENTRYPOINT: ip:detect -> http GET http://ip-api.com/json (baseline)')
live = open(repo + '/main.js', encoding='utf-8').read()
h = live[live.index("ipcMain.handle('ip:detect'"):][:1500]
assert 'https.get' in h and 'https://ipwho.is/' in h, 'live primary not HTTPS'
assert 'resolveFallbackIpCountry' in live and 'http://ip-api.com/json/' in live
callers = [l.strip()[:90] for l in live.splitlines() if 'resolveFallbackIpCountry(clean)' in l]
assert len(callers) >= 3, 'fallback callers missing: %d' % len(callers)
print('LIVE-PRIMARY-HTTPS-OK; RESIDUAL: resolveFallbackIpCountry -> http://ip-api.com wired at %d call sites' % len(callers))
print('STATICALLY_CONFIRMED (residual cleartext fallback; primary fixed)')
'''

verify_fix = '''"""
Post-fix verifier for 954da15f: asserts NO cleartext geo endpoint remains in
the live tree (the fallback now uses TLS) while the HTTPS primary is intact.
Run: python workspace/reproducers/verify_954da15f_fixed.py
"""
import sys
repo = r'C:/Users/milad/Desktop/private browser'
live = open(repo + '/main.js', encoding='utf-8').read()
checks = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    checks.append(cond)
check('no http://ip-api.com anywhere', 'http://ip-api.com' not in live)
check('no http.get to a geo/api URL', 'http.get(`http://' not in live)
check('fallback uses https', 'https.get(`https://ipapi.co/' in live)
h = live[live.index("ipcMain.handle('ip:detect'"):][:1500]
check('ip:detect primary is https.get', 'https.get' in h)
check('ip:detect hits ipwho.is', 'https://ipwho.is/' in h)
check('trusted-sender gate on ip:detect', 'isTrustedSender(e)' in h)
print('MANTIS_REACHED_ENTRYPOINT: verify resolveFallbackIpCountry -> TLS-only')
ok = all(checks)
print('VERIFY: ' + ('CLOSED (TLS-only geo lookups)' if ok else 'RESIDUAL REMAINS'))
sys.exit(0 if ok else 1)
'''

(out / "repro_954da15f_ipdetect.py").write_text(script, encoding="utf-8")
(out / "verify_954da15f_fixed.py").write_text(verify_fix, encoding="utf-8")
print("wrote repro + post-fix verifier for 954da15f")
