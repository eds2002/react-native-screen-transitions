#!/bin/zsh
# bounds lab, zoom mode: open tile a, then pinch in (fingers together) to dismiss; then open it again
# and swipe down to dismiss, for comparison.
#   zoom-pinch.sh <udid>   (starts and ends on the grid)
U=$1; E=${0:a:h:h}
$E/wait-settled.sh $U grid || exit 1
$E/tap.sh $U bounds-tile-a; $E/wait-settled.sh $U zoom 6 || exit 1; sleep 0.4
argent run gesture-pinch --udid $U --centerX 0.5 --centerY 0.5 --startDistance 0.6 --endDistance 0.15 --durationMs 500 --json >/dev/null 2>&1
$E/wait-settled.sh $U grid 6 || { echo "zoom-pinch: pinch did not dismiss" >&2; R=1; }
sleep 0.4; $E/tap.sh $U bounds-tile-a; $E/wait-settled.sh $U zoom 6 || exit 1; sleep 0.4
$E/gesture.sh $U "down 0.5,0.4; move 0.5,0.8 300; up"
$E/wait-settled.sh $U grid 6 || { echo "zoom-pinch: swipe did not dismiss" >&2; R=1; }
exit ${R:-0}
