"""
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
