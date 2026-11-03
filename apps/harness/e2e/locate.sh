#!/bin/zsh
# Prints "x y" (normalized centre) of the element with testID $2.  usage: locate.sh <udid> <testID>
argent run describe --udid "$1" --json 2>/dev/null | python3 -I -c '
import json, re, sys
raw = sys.stdin.read(); raw = raw[raw.index("{"):]
for line in json.loads(raw)["description"].splitlines():
    m = re.search(r"id=\"([^\"]+)\"\s+\(([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\)", line)
    if m and m.group(1) == sys.argv[1]:
        x, y, w, h = map(float, m.groups()[1:]); print(round(x + w / 2, 4), round(y + h / 2, 4)); break
' "$2"
