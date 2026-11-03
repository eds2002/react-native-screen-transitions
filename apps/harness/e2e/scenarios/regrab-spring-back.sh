#!/bin/zsh
# gestures lab, card screen: drag right ~16% slowly so the release springs back,
# then grab again <delay> ms after release (during the spring-back), drag a little, release.
#   regrab-spring-back.sh <udid> <delayMs>   (starts and ends on gestures home)
U=$1; D=${2:-100}; E=${0:a:h:h}
$E/wait-settled.sh $U home || exit 1
$E/tap.sh $U gestures-open-card; $E/wait-settled.sh $U card || exit 1; sleep 0.3
$E/gesture.sh $U "down 0.2,0.6; move 0.36,0.6 450; up; wait $D; down 0.3,0.6; move 0.4,0.6 400; up"
$E/wait-settled.sh $U card || exit 1; sleep 0.3
$E/gesture.sh $U "down 0.1,0.6; move 0.95,0.6 250; up"
$E/wait-settled.sh $U home
