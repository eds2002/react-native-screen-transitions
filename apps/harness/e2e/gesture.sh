#!/bin/zsh
# Plays a finger script (see finger.py) on the device.  usage: gesture.sh <udid> "<script>"
argent run gesture-custom --udid "$1" --events-json "$(python3 -I ${0:a:h}/finger.py "$2")" --json >/dev/null 2>&1
