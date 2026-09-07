# MANTIS_HELPER_VERSION = 2
"""Append calibration fields to a finding file (token-optimized updater)."""
import json
import sys
from pathlib import Path

REPO = Path(r"C:\Users\milad\Desktop\private browser")
DIR = REPO / "workspace" / "findings"


def main():
    finding_id = sys.argv[1]
    payload = json.loads(sys.argv[2])
    path = DIR / (finding_id + ".json")
    data = json.loads(path.read_text(encoding="utf-8"))
    for key, value in payload.items():
        if key == "history_entry":
            data.setdefault("history", []).append(value)
        else:
            data[key] = value
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("calibrated", finding_id[:8], "->", data.get("mantis_risk_score"), data.get("priority"))


if __name__ == "__main__":
    main()
