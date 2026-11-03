#!/bin/zsh
# stack lab: push (fixed bar), then grab the incoming screen <delay> ms later while it slides in, and
#   letgo:   drag it right a little and let go  → it should carry on opening from where it is (depth 2)
#   dismiss: fling it right                       → it should close from where it is (depth 1)
#   stack-grab-mid-push.sh <udid> <delayMs> <letgo|dismiss>   (starts and ends on A)
U=$1; D=${2:-150}; MODE=${3:-letgo}; E=${0:a:h:h}
$E/wait-settled.sh $U A || exit 1
read PX PY <<< $($E/locate.sh $U stack-bar-push)
if [[ $MODE == letgo ]]; then DRAG="move 0.86,0.6 200; up"; WANT=2; else DRAG="move 0.99,0.6 90; up"; fi
# The incoming screen enters from the right: grab near the right edge so the finger lands on it.
$E/gesture.sh $U "down $PX,$PY; hold 32; up; wait $D; down 0.8,0.6; $DRAG"
sleep 0.5; $E/wait-settled.sh $U "" 6 || exit 1
S=$($E/state.sh $U)
if [[ $MODE == letgo ]]; then
  [[ $S == *'"depth":2'* ]] || { echo "grab-mid-push: expected B open after let go: $S" >&2; R=1; }
  read QX QY <<< $($E/locate.sh $U stack-bar-pop); argent run gesture-tap --udid $U --x $QX --y $QY --json >/dev/null 2>&1
else
  [[ $S == *'"depth":1'* ]] || { echo "grab-mid-push: expected B dismissed: $S" >&2; R=1; }
fi
$E/wait-settled.sh $U A || exit 1
exit ${R:-0}
