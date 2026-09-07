# MANTIS_HELPER_VERSION = 2
import sys
import os
import json
from datetime import datetime, timezone

def append_review(finding_path, status, reasoning, repro_hints, triage_checklist_json, pass_number, timestamp, snapshot=""):
    if not os.path.exists(finding_path):
        print(f"Error: finding file {finding_path} does not exist", file=sys.stderr)
        sys.exit(1)

    with open(finding_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Idempotency check: (pass_number, snapshot)
    history = data.get('history', [])
    for entry in history:
        if entry.get('stage') == 'reviewer' and entry.get('pass_number') == pass_number:
            if snapshot:
                if entry.get('snapshot') == snapshot:
                    print(f"Skipping {finding_path}: already reviewed for pass {pass_number} and snapshot {snapshot}")
                    return
            else:
                print(f"Skipping {finding_path}: already reviewed for pass {pass_number} (mode-off)")
                return

    data['status'] = status
    data['reasoning'] = reasoning
    if repro_hints:
        data['repro_hints'] = repro_hints

    if isinstance(triage_checklist_json, str):
        data['triage_checklist'] = json.loads(triage_checklist_json)
    else:
        data['triage_checklist'] = triage_checklist_json

    review_history_entry = {
        "stage": "reviewer",
        "action": "reviewed",
        "details": f"Determined status as {status} because {reasoning}",
        "pass_number": pass_number,
        "snapshot": snapshot,
        "timestamp": timestamp
    }
    history.append(review_history_entry)
    data['history'] = history

    with open(finding_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Successfully updated review for {data.get('id', os.path.basename(finding_path))} -> {status}")

if __name__ == '__main__':
    if len(sys.argv) < 7:
        print("Usage: append_review.py <finding_path> <status> <reasoning> <repro_hints> <triage_checklist_json> <pass_number> [timestamp] [snapshot]")
        sys.exit(1)

    finding_path = sys.argv[1]
    status = sys.argv[2]
    reasoning = sys.argv[3]
    repro_hints = sys.argv[4] if sys.argv[4] != "None" else ""
    triage_checklist_json = sys.argv[5]
    pass_number = int(sys.argv[6])
    timestamp = sys.argv[7] if len(sys.argv) > 7 else datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    snapshot = sys.argv[8] if len(sys.argv) > 8 else ""

    append_review(finding_path, status, reasoning, repro_hints, triage_checklist_json, pass_number, timestamp, snapshot)
