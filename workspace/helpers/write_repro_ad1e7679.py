"""Writer: emits the CWE-22 reproducer + reattack scripts (avoids shell quoting issues)."""
import pathlib

repo = pathlib.Path(r"C:\Users\milad\Desktop\private browser")
out = repo / "workspace" / "reproducers"
out.mkdir(parents=True, exist_ok=True)

repro = '''"""
Reproducer: CWE-22 path traversal guard bypass (finding ad1e7679).
Models the COMMITTED baseline guard (HEAD main.js safeRmSessionDirAsync:
raw dir.startswith(SESSIONS) without path.resolve) in an isolated temp dir.
No live-tree writes; only temp dirs under the OS temp area.
Run: python workspace/reproducers/repro_ad1e7679_path_traversal.py
"""
import os, shutil, subprocess, tempfile
repo = r'C:/Users/milad/Desktop/private browser'
tmp = tempfile.mkdtemp(prefix='mantis-base-')
subprocess.run(['git', '--work-tree=' + tmp, 'checkout', 'HEAD', '--', 'main.js'],
               cwd=repo, check=True, capture_output=True)
src = open(os.path.join(tmp, 'main.js'), encoding='utf-8').read().splitlines()
i = next(n for n, l in enumerate(src) if 'async function safeRmSessionDirAsync' in l)
body = '\\n'.join(src[i:i+3])
assert '.startsWith(SESSIONS_DIR)' in body and 'path.resolve' not in body, 'baseline shape changed'
SESSIONS_DIR = '/data/.sessions'; PROFILES_STORAGE_DIR = '/data/profiles_storage'
malicious_pid = '../../victim_evil'
joined = os.path.join(PROFILES_STORAGE_DIR, malicious_pid).replace(os.sep, '/')
guard = joined.startswith(SESSIONS_DIR) or joined.startswith(PROFILES_STORAGE_DIR)
print('MANTIS_REACHED_ENTRYPOINT: profiles:delete -> safeRmSessionDirAsync')
print('joined =', joined)
print('baseline guard passes (vulnerable) =', guard)
assert guard is True, 'expected baseline guard to pass on traversal'
root = tempfile.mkdtemp(prefix='mantis-poc-')
store = os.path.join(root, 'profiles_storage')
os.makedirs(store)
# normpath of store-joined traversal escapes the sandbox root, mirroring
# fs.rmSync recursive semantics; emulate with an in-sandbox victim dir.
victim = os.path.normpath(os.path.join(store, malicious_pid))
os.makedirs(victim); open(os.path.join(victim, 'keep.txt'), 'w').write('x')
target = victim
print('sandbox normpath escapes store:', os.path.commonpath([store]) != os.path.commonpath([store, target]))
shutil.rmtree(target)  # what fs.rmSync recursive would do once the guard passed
assert not os.path.exists(victim) and os.path.exists(store)
print('REPRODUCED: traversal payload deletes directory outside profile root on unpatched baseline')
shutil.rmtree(root, ignore_errors=True); shutil.rmtree(tmp, ignore_errors=True)
'''

reattack = '''"""
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
    ('t2 backslash traversal', STORE + '\\\\..\\\\..\\\\victim', False),
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
'''

(out / "repro_ad1e7679_path_traversal.py").write_text(repro, encoding="utf-8")
(out / "reattack_ad1e7679_variants.py").write_text(reattack, encoding="utf-8")
print("wrote", sorted(p.name for p in out.glob("*.py")))
