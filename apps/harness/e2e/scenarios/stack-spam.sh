#!/bin/zsh
# stack lab: taps the fixed push / pop bar in one timed gesture, then checks the stack depth matches the
# presses the app received (fast taps can be lost on the way in), then pops back to A.
#   stack-spam.sh <udid> <pairs> <gapMs> [alt|burst]
#   alt:   push, pop, push, pop ...            (<pairs> pushes and pops, <gapMs> between taps)
#   burst: push x5 then pop x5, repeated       (<pairs> rounded to multiples of 5)
U=$1; N=${2:-25}; GAP=${3:-100}; MODE=${4:-alt}; E=${0:a:h:h}
$E/wait-settled.sh $U A || exit 1
read PX PY <<< $($E/locate.sh $U stack-bar-push); read QX QY <<< $($E/locate.sh $U stack-bar-pop)
[[ -z $PX || -z $QX ]] && { echo "stack-spam: bar not found" >&2; exit 1; }
EVENTS=$(python3 -I -c '
import json, sys
n, gap, mode, px, py, qx, qy = int(sys.argv[1]), float(sys.argv[2]), sys.argv[3], *map(float, sys.argv[4:])
if mode == "alt":
    seq = ["push", "pop"] * n
else:
    seq = (["push"] * 5 + ["pop"] * 5) * max(1, n // 5)
ev = []
for k, what in enumerate(seq):
    x, y = (px, py) if what == "push" else (qx, qy)
    ev.append({"type": "Down", "x": x, "y": y, "delayMs": 0 if k == 0 else max(0, gap - 40)})
    ev.append({"type": "Up", "x": x, "y": y, "delayMs": 40})
print(json.dumps(ev))' $N $GAP $MODE $PX $PY $QX $QY)
argent run gesture-custom --udid $U --events-json "$EVENTS" --json >/dev/null 2>&1
sleep 0.5; $E/wait-settled.sh $U "" 10 || exit 1
# Fast taps can be lost before they reach the app, so check against the presses that arrived.
$E/state.sh $U | python3 -I -c '
import json, sys
s = json.load(sys.stdin); c = s.get("counts", {})
want = 1 + c.get("bar-push", 0) - (c.get("bar-pop", 0) - c.get("bar-pop-ignored", 0))
push, pop, ignored = c.get("bar-push", 0), c.get("bar-pop", 0), c.get("bar-pop-ignored", 0)
print("stack-spam: presses push %d pop %d (ignored %d); depth %d (expected %d)" % (push, pop, ignored, s["depth"], want), file=sys.stderr)
ok = s["depth"] == want and s["settled"] and s["errors"] == 0 and len(s["screens"]) >= 1
sys.exit(0 if ok else 1)' || { echo "stack-spam: end state wrong: $($E/state.sh $U)" >&2; exit 1; }
# Back to A for the next run.
while [[ $($E/state.sh $U) != *'"depth":1'* ]]; do
  argent run gesture-tap --udid $U --x $QX --y $QY --json >/dev/null 2>&1; sleep 0.6
done
$E/wait-settled.sh $U A
