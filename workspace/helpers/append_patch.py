# MANTIS_HELPER_VERSION = 2
import sys
import os
import json
from datetime import datetime, timezone

def append_patch(finding_path, patch_status, patch_diff, pass_number, timestamp, patch_base_snapshot="", reattack_status=None, reattack_variants=None):
    if not os.path.exists(finding_path):
        print(f"Error: finding file {finding_path} does not exist", file=sys.stderr)
        sys.exit(1)

    with open(finding_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    data['patch_status'] = patch_status
    if patch_base_snapshot:
        data['patch_base_snapshot'] = patch_base_snapshot

    if patch_diff:
        data['patch_diff'] = patch_diff

    if reattack_status:
        data['reattack_status'] = reattack_status
    if reattack_variants is not None:
        data['reattack_variants'] = reattack_variants

    history = data.get('history', [])
    history_entry = {
        "stage": "patch",
        "action": "patched",
        "details": f"Patch status evaluated as {patch_status} on snapshot {patch_base_snapshot or 'legacy'}",
        "pass_number": pass_number,
        "timestamp": timestamp
    }
    history.append(history_entry)
    data['history'] = history

    with open(finding_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Successfully updated patch for {data.get('id', os.path.basename(finding_path))} -> {patch_status}")

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print("Usage: append_patch.py <finding_path> <patch_status> <patch_diff_file_or_string> <pass_number> [timestamp] [patch_base_snapshot]")
        sys.exit(1)

    finding_path = sys.argv[1]
    patch_status = sys.argv[2]
    patch_diff = sys.argv[3]
    if os.path.exists(patch_diff):
        try:
            with open(patch_diff, 'r', encoding='utf-8') as pf:
                patch_diff = pf.read()
        except UnicodeDecodeError:
            with open(patch_diff, 'r', encoding='utf-16') as pf:
                patch_diff = pf.read()

    pass_number = int(sys.argv[4])
    timestamp = sys.argv[5] if len(sys.argv) > 5 else datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    patch_base_snapshot = sys.argv[6] if len(sys.argv) > 6 else ""

    append_patch(finding_path, patch_status, patch_diff, pass_number, timestamp, patch_base_snapshot)
