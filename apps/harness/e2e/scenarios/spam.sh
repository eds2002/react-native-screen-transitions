#!/bin/bash
# Spam a boundary lab and check the tracked element (marker=1) frame by frame.
#
#   spam.sh <shared-bounds|shared-elements> "<query>" <name> "<finger script>" [settle s]
#
# Opens harness://lab/<lab>?<query>&marker=1 on the booted simulator, records the screen while the
# finger script (e2e/finger.py syntax) plays as one gesture, waits for it to settle, then prints one
# JSON line: the lab state (path, level, errors, settled) and e2e/visual/marker.py's verdict.
# The recording and the per-frame track land in e2e/results/spam/<name>/.
set -uo pipefail
E2E=$(cd "$(dirname "$0")/.." && pwd)
U=${UDID:-$(xcrun simctl list devices booted | grep -oE '[0-9A-F-]{36}' | head -1)}
LAB=$1; Q=$2; N=$3; SCRIPT=$4; SETTLE=${5:-2.5}
OUT=$E2E/results/spam/$N; mkdir -p "$OUT"
xcrun simctl terminate "$U" com.eds2002.harness >/dev/null 2>&1
xcrun simctl openurl "$U" "harness://lab/$LAB?$Q&marker=1"; sleep 3
xcrun simctl io "$U" recordVideo --codec h264 --force "$OUT/rec.mp4" >/dev/null 2>&1 & REC=$!
sleep 1
argent run gesture-custom --udid "$U" --events-json "$(python3 -I "$E2E/finger.py" "$SCRIPT")" --json >/dev/null 2>&1
sleep "$SETTLE"
kill -INT $REC; wait $REC 2>/dev/null
STATE=$(argent run describe --udid "$U" --json 2>/dev/null | python3 -I -c '
import json, re, sys
d = json.load(sys.stdin)["description"]
m = re.search(r"\"(\{\\?\"lab.*?\})\" id=\"harness-state\"", d)
s = json.loads(m.group(1).replace("\\\"", "\"")) if m else {}
lv = re.findall(r"at:\S+ level:(\d+)", d)
print(json.dumps({"path": s.get("path"), "settled": s.get("settled"), "errors": s.get("errors"),
  "levels": sorted({int(x) for x in lv}), "screens": len(s.get("screens", []))}))')
VERDICT=$(python3 -I "$E2E/visual/marker.py" "$OUT/rec.mp4" --json "$OUT/track.json" | head -1)
echo "{\"name\":\"$N\",\"state\":$STATE,\"marker\":$VERDICT}"
