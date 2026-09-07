import os
import sys
import tempfile
import difflib

# 1. Verify unpatched vs patched logic
temp_test = tempfile.mkdtemp()
sessions_dir = os.path.join(temp_test, 'sessions')
profiles_storage = os.path.join(temp_test, 'profiles_storage')
legacy_dir = os.path.join(temp_test, 'legacy')
victim_dir = os.path.join(temp_test, 'victim_dir')

for d in [sessions_dir, profiles_storage, legacy_dir, victim_dir]:
    os.makedirs(d, exist_ok=True)

# Unpatched function logic:
def unpatched_safe_rm(target_dir):
    # Old logic: dir.startsWith(SESSIONS_DIR) || dir.startsWith(PROFILES_STORAGE_DIR)
    if target_dir and (target_dir.startswith(sessions_dir) or target_dir.startswith(profiles_storage)):
        if os.path.exists(target_dir):
            import shutil
            shutil.rmtree(target_dir)

# If pid is empty string:
empty_pid = ""
unpatched_target = os.path.join(profiles_storage, empty_pid)
# unpatched_target is profiles_storage itself!
assert unpatched_target.startswith(profiles_storage) == True
print("Unpatched baseline confirmed: empty profileId targets profiles_storage root directly.")

# Patched logic:
def is_valid_profile_id(pid):
    import re
    return bool(isinstance(pid, str) and re.match(r'^[a-zA-Z0-9_-]{1,128}$', pid))

def patched_safe_rm(target_dir):
    if not target_dir:
        return False
    resolved = os.path.abspath(target_dir)
    sessions_base = os.path.abspath(sessions_dir) + os.sep
    storage_base = os.path.abspath(profiles_storage) + os.sep
    if (resolved.startswith(sessions_base) or resolved.startswith(storage_base)) and os.path.exists(resolved):
        import shutil
        shutil.rmtree(resolved)
        return True
    return False

# Test patched logic with empty, dot, traversal, and valid IDs:
assert not is_valid_profile_id("")
assert not is_valid_profile_id(".")
assert not is_valid_profile_id("../victim_dir")
assert is_valid_profile_id("p1234_test-1")

assert not patched_safe_rm(os.path.join(profiles_storage, ""))
assert not patched_safe_rm(os.path.join(profiles_storage, "..", "victim_dir"))

# Test valid deletion within profile storage:
valid_profile_path = os.path.join(profiles_storage, "p1234_test-1")
os.makedirs(valid_profile_path, exist_ok=True)
assert patched_safe_rm(valid_profile_path) == True
assert not os.path.exists(valid_profile_path)
assert os.path.exists(profiles_storage)
assert os.path.exists(victim_dir)

print("Patched logic verification: ALL TESTS PASSED.")

# Clean up test dir
import shutil
shutil.rmtree(temp_test)
