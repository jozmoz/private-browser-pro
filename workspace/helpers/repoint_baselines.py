"""Writer: point historical repros at the true pre-fix commit (3969557) for the
baseline half. HEAD moved (new fix commit 7c47baf), so HEAD:main.js is no longer
the vulnerable baseline. Live tree is read from the working copy throughout."""
import pathlib

repo = pathlib.Path(r"C:\Users\milad\Desktop\private browser")
PRE = "3969557"

# --- traversal historical repro: baseline via git show PRE:main.js ---
trav = (repo / "workspace" / "reproducers" / "repro_ad1e7679_path_traversal.py").read_text(encoding="utf-8")
trav = trav.replace(
    "subprocess.run(['git', '--work-tree=' + tmp, 'checkout', 'HEAD', '--', 'main.js'],\n"
    "               cwd=repo, check=True, capture_output=True)\n"
    "src = open(os.path.join(tmp, 'main.js'), encoding='utf-8').read().splitlines()",
    "base = subprocess.run(['git', 'show', '" + PRE + ":main.js'], cwd=repo, check=True,\n"
    "                       capture_output=True).stdout.decode('utf-8')\n"
    "src = base.splitlines()",
)
trav = trav.replace(
    "shutil.rmtree(root, ignore_errors=True); shutil.rmtree(tmp, ignore_errors=True)",
    "shutil.rmtree(root, ignore_errors=True)",
)
trav = trav.replace("import os, shutil, subprocess, tempfile", "import os, shutil, subprocess, tempfile  # noqa")
(repo / "workspace" / "reproducers" / "repro_ad1e7679_path_traversal.py").write_text(trav, encoding="utf-8")

# --- ipdetect historical repro: baseline via git show PRE:main.js ---
ip = (repo / "workspace" / "reproducers" / "repro_954da15f_ipdetect.py").read_text(encoding="utf-8")
ip = ip.replace("['git', 'show', 'HEAD:main.js']", "['git', 'show', '" + PRE + ":main.js']")
# The pre-fix baseline had the cleartext call inline in ip:detect (no fallback fn yet):
ip = ip.replace('assert "http://ip-api.com/json" in base, \'baseline shape changed\'',
                'assert "http.get(\'http://ip-api.com/json\'" in base, \'baseline shape changed\'')
ip = ip.replace("print('MANTIS_REACHED_ENTRYPOINT: ip:detect -> http GET http://ip-api.com/json (baseline)')",
                "print('MANTIS_REACHED_ENTRYPOINT: ip:detect -> http.get http://ip-api.com/json (baseline)')")
# Live half becomes a post-fix assertion (residual closed by this session's fix):
ip = ip.replace(
    "assert 'resolveFallbackIpCountry' in live and 'http://ip-api.com/json/' in live\n"
    "callers = [l.strip()[:90] for l in live.splitlines() if 'resolveFallbackIpCountry(clean)' in l]\n"
    "assert len(callers) >= 3, 'fallback callers missing: %d' % len(callers)\n"
    "print('LIVE-PRIMARY-HTTPS-OK; RESIDUAL: resolveFallbackIpCountry -> http://ip-api.com wired at %d call sites' % len(callers))\n"
    "print('STATICALLY_CONFIRMED (residual cleartext fallback; primary fixed)')",
    "assert 'http://ip-api.com' not in live, 'cleartext geo endpoint still present'\n"
    "h = live[live.index(\"ipcMain.handle('ip:detect'\"):][:1500]\n"
    "assert 'https.get' in h and 'https://ipwho.is/' in h, 'live primary not HTTPS'\n"
    "print('LIVE: TLS-only geo lookups (residual closed by current fix)')\n"
    "print('STATICALLY_CONFIRMED (baseline flaw proven; live fix verified)')",
)
(repo / "workspace" / "reproducers" / "repro_954da15f_ipdetect.py").write_text(ip, encoding="utf-8")
print("repointed traversal + ipdetect historical repros at", PRE)
