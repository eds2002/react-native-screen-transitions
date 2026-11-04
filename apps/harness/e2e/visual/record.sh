#!/bin/zsh
# Records the iOS simulator or Android device/emulator (adb serial) while a scenario runs, then analyzes the recording.
#   record.sh <udid> <outDir> [analyze.py options] -- <scenario command...>
# Writes <outDir>/run.mov, report.json, event-*.png and scenario.json ({"exit": n, "log": "..."}).
# Exits non-zero if the scenario's own checks failed or the analyzer flagged a failure.
U=$1; OUT=$2; shift 2
OPTS=(); while [[ $# -gt 0 && $1 != "--" ]]; do OPTS+=$1; shift; done; shift
mkdir -p $OUT
# Android (an adb serial): record on the device and pass the analyzer the window size in dp.
if adb devices 2>/dev/null | grep -q "^${U}[[:space:]]"; then
  PX=$(adb -s $U shell wm size | awk -F': ' '/Physical size/ {print $2}' | tr -d '\r')
  DPI=$(adb -s $U shell wm density | awk -F': ' '/Physical density/ {print $2}' | tr -d '\r')
  OPTS+=(--points $(python3 -I -c 'import sys; w,h=map(int,sys.argv[1].split("x")); d=int(sys.argv[2]); print(f"{round(w*160/d)}x{round(h*160/d)}")' $PX $DPI))
  adb -s $U shell rm -f /sdcard/harness-run.mp4
  # Half resolution in the screen's own shape (the default is letterboxed into the encoder's size).
  SIZE=$(python3 -I -c 'import sys; w,h=map(int,sys.argv[1].split("x")); print(f"{w//4*2}x{h//4*2}")' $PX)
  adb -s $U shell screenrecord --size $SIZE --bit-rate 20000000 /sdcard/harness-run.mp4 >/dev/null 2>&1 &
  REC=$!; sleep 1.5
  "$@" 2> $OUT/scenario.log; SC=$?
  sleep 1
  adb -s $U shell pkill -INT screenrecord; wait $REC 2>/dev/null; sleep 0.5
  adb -s $U pull /sdcard/harness-run.mp4 $OUT/run.mov >/dev/null 2>&1
else
  xcrun simctl io $U recordVideo --codec=h264 --force $OUT/run.mov >/dev/null 2>&1 &
  REC=$!; sleep 1.5
  "$@" 2> $OUT/scenario.log; SC=$?
  sleep 1
  kill -INT $REC; wait $REC 2>/dev/null
fi
python3 -I -c 'import json,sys; json.dump({"exit": int(sys.argv[1]), "log": open(sys.argv[2]).read()}, open(sys.argv[3], "w"))' $SC $OUT/scenario.log $OUT/scenario.json
cat $OUT/scenario.log >&2
python3 -I ${0:a:h}/analyze.py $OUT/run.mov --out $OUT $OPTS 2> >(grep -v dts >&2); AN=$?
(( SC != 0 )) && exit 2
exit $AN
