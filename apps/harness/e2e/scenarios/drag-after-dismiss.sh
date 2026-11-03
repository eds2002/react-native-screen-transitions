#!/bin/zsh
# stack lab: push B and C, fling C away, then <delay> ms later drag B right slowly and let it spring back.
# B should follow the finger whenever the drag starts, even while C is still closing.
#   drag-after-dismiss.sh <udid> <delayMs>   (starts and ends on A)
U=$1; D=${2:-100}; E=${0:a:h:h}
$E/wait-settled.sh $U A || exit 1
read PX PY <<< $($E/locate.sh $U stack-bar-push)
argent run gesture-tap --udid $U --x $PX --y $PY --json >/dev/null 2>&1; $E/wait-settled.sh $U B || exit 1
argent run gesture-tap --udid $U --x $PX --y $PY --json >/dev/null 2>&1; $E/wait-settled.sh $U C || exit 1; sleep 0.3
BEFORE=$($E/state.sh $U | python3 -c 'import json,sys; print(json.load(sys.stdin)["counts"].get("drag:B",0))')
$E/gesture.sh $U "down 0.15,0.6; move 0.9,0.6 120; up; wait $D; down 0.15,0.6; move 0.35,0.6 400; hold 300; up"
sleep 1; $E/wait-settled.sh $U B 6 || { echo "drag-after-dismiss: expected B after: $($E/state.sh $U)" >&2; R=1; }
AFTER=$($E/state.sh $U | python3 -c 'import json,sys; print(json.load(sys.stdin)["counts"].get("drag:B",0))')
[[ $AFTER -gt $BEFORE ]] || { echo "drag-after-dismiss: B never started dragging (${D} ms after C's fling)" >&2; R=1; }
read QX QY <<< $($E/locate.sh $U stack-bar-pop); argent run gesture-tap --udid $U --x $QX --y $QY --json >/dev/null 2>&1
$E/wait-settled.sh $U A 6
exit ${R:-0}
