#!/bin/zsh
# sheet lab, snap sheet (0.4 / 0.7 / 1):
#   spring-back: drag the sheet down a little and let go (springs back to 0.4), grab again <delay> ms later
#   during-snap: tap "snap 2" (animates to full height), grab the sheet <delay> ms into it, hold, let go
#   sheet-regrab.sh <udid> <delayMs> <spring-back|during-snap>   (starts and ends on the sheet home)
U=$1; D=${2:-100}; MODE=${3:-spring-back}; E=${0:a:h:h}
$E/wait-settled.sh $U Home || exit 1
$E/tap.sh $U sheet-open-snap; $E/wait-settled.sh $U Snap || exit 1; sleep 0.4
if [[ $MODE == spring-back ]]; then
  $E/gesture.sh $U "down 0.5,0.66; move 0.5,0.74 350; up; wait $D; down 0.5,0.7; move 0.5,0.76 300; up"
else
  read SX SY <<< $($E/locate.sh $U sheet-snap-to-2)
  $E/gesture.sh $U "down $SX,$SY; hold 32; up; wait $D; down 0.5,0.8; move 0.5,0.82 200; hold 150; up"
fi
sleep 0.5; $E/wait-settled.sh $U Snap 6 || { echo "sheet-regrab: sheet closed or did not settle" >&2; R=1; }
$E/tap.sh $U sheet-snap-close; $E/wait-settled.sh $U Home 6 || exit 1
exit ${R:-0}
