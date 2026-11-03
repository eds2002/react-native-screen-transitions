#!/bin/zsh
# ownership lab, L1 (vertical) → L2 (horizontal): short drags alternating ↓ (owned by L1) and → (owned by L2),
# each released short of dismissing, <wait> ms apart so a drag often starts while the other owner springs back.
# Then → dismisses L2 and ↓ dismisses L1.
#   ownership-spam.sh <udid> <waitMs> [pairs=4]   (starts and ends on home)
U=$1; W=${2:-150}; N=${3:-4}; E=${0:a:h:h}
$E/wait-settled.sh $U home || exit 1
$E/tap.sh $U ownership-open-l1; $E/wait-settled.sh $U L1/index || exit 1
$E/tap.sh $U ownership-open-l2; $E/wait-settled.sh $U L1/L2/index || exit 1; sleep 0.3
SCRIPT=""
for k in $(seq 1 $N); do
  SCRIPT+="down 0.5,0.35; move 0.5,0.5 300; up; wait $W; down 0.2,0.6; move 0.35,0.6 300; up; wait $W; "
done
$E/gesture.sh $U "$SCRIPT"
sleep 0.5; $E/wait-settled.sh $U L1/L2/index 6 || { echo "ownership-spam: short drags dismissed something" >&2; R=1; }
$E/gesture.sh $U "down 0.1,0.6; move 0.95,0.6 250; up"; $E/wait-settled.sh $U L1/index 6 || { echo "ownership-spam: → did not dismiss L2 alone" >&2; R=1; }
sleep 0.3; $E/gesture.sh $U "down 0.5,0.3; move 0.5,0.95 250; up"; $E/wait-settled.sh $U home 6 || { echo "ownership-spam: ↓ did not dismiss L1" >&2; exit 1; }
exit ${R:-0}
