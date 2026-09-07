"""
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
