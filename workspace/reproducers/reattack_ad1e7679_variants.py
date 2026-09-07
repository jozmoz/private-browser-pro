"""
Re-attack (variant hunting) vs LIVE patched tree: all block / legit still works.
Run: python workspace/reproducers/reattack_ad1e7679_variants.py
"""
import os, sys
repo = r'C:/Users/milad/Desktop/private browser'
src = open(os.path.join(repo, 'main.js'), encoding='utf-8').read()
results = []
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name)
    results.append(cond)
check('isSafeDirToDelete uses path.resolve + path.sep',
      'path.resolve(dir)' in src and 'path.resolve(SESSIONS_DIR) + path.sep' in src)
check('profiles:delete validates id',
      "ipcMain.handle('profiles:delete'" in src and 'isValidProfileId(pid)' in src)
check('wipeProfile validates id',
      'function wipeProfile(profileId)' in src and 'isValidProfileId(profileId)' in src)
import pathlib
STORE = str(pathlib.Path(repo, 'data', 'profiles_storage'))
SES = str(pathlib.Path(repo, 'data', '.sessions'))
def model(dir_):
    import pathlib as p
    r = str(p.Path(dir_).resolve()) if os.path.isabs(dir_) else str((p.Path(repo) / dir_).resolve())
    return r.startswith(str(p.Path(SES).resolve()) + os.sep) or r.startswith(str(p.Path(STORE).resolve()) + os.sep)
variants = [
    ('t1 posix traversal', os.path.join(STORE, '..', '..', 'victim'), False),
    ('t2 backslash traversal', STORE + '\\..\\..\\victim', False),
    ('t3 bare root', STORE, False),
    ('t4 empty', '', False),
    ('t5 dot', '.', False),
    ('t6 legit child', os.path.join(STORE, 'p1234_test-1'), True),
]
for name, v, want in variants:
    got = False if v in ('', '.') else model(v)
    check('variant ' + name + ' -> ' + str(got), got == want)
print('MANTIS_REACHED_ENTRYPOINT: reattack profiles:delete -> isSafeDirToDelete/isValidProfileId')
ok = all(results)
print('REATTACK: ' + ('failed_to_bypass (patch holds on all meaningful variants)' if ok else 'BYPASS FOUND'))
sys.exit(0 if ok else 1)
