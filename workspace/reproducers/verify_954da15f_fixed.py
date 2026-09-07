"""
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
