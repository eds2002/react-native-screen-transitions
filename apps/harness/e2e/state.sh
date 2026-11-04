#!/bin/zsh
# Prints the harness debug bridge state (the hidden `harness-state` element) as JSON, or null.
# usage: state.sh <udid>
argent run describe --udid "$1" --json 2>/dev/null | python3 -I -c '
import json, re, sys
raw = sys.stdin.read(); raw = raw[raw.index("{"):]
m = re.search(r"\"(\{.*\})\" id=\"harness-state\"", json.loads(raw)["description"])
print(m.group(1) if m else "null")'
