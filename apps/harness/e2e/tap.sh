#!/bin/zsh
# Taps the centre of the element with testID $2.  usage: tap.sh <udid> <testID>
read x y <<< $(argent run describe --udid "$1" --json 2>/dev/null | python3 -I -c '
import json, re, sys
raw = sys.stdin.read(); raw = raw[raw.index("{"):]
for line in json.loads(raw)["description"].splitlines():
    m = re.search(r"id=\"([^\"]+)\"\s+\(([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\)", line)
    if m and m.group(1) == sys.argv[1]:
        x, y, w, h = map(float, m.groups()[1:]); print(x + w / 2, y + h / 2); break
' "$2")
[ -z "$x" ] && { echo "tap.sh: no element $2" >&2; exit 1; }
argent run gesture-tap --udid "$1" --x $x --y $y --json >/dev/null 2>&1
