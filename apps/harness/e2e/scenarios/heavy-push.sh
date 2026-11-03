#!/bin/zsh
# heavy lab: push a B that burns <cost> ms on its first render, let it settle, pop.
# The recording must show B entering from the right edge (no pop-in) with nothing blank behind A.
#   heavy-push.sh <udid> <costMs: 0|150|400|800>   (starts and ends on A)
U=$1; C=${2:-400}; E=${0:a:h:h}
$E/wait-settled.sh $U A || exit 1
$E/tap.sh $U heavy-push-$C; $E/wait-settled.sh $U B 10 || { echo "heavy-push: B did not settle" >&2; exit 1; }
sleep 0.3; $E/tap.sh $U heavy-b-pop; $E/wait-settled.sh $U A 6
