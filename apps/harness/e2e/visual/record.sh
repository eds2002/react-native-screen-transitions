#!/bin/zsh
# Records the simulator while a command runs, then analyzes the recording.
#   record.sh <udid> <outDir> [analyze.py options] -- <command...>
U=$1; OUT=$2; shift 2
OPTS=(); while [[ $# -gt 0 && $1 != "--" ]]; do OPTS+=$1; shift; done; shift
mkdir -p $OUT
xcrun simctl io $U recordVideo --codec=h264 --force $OUT/run.mov >/dev/null 2>&1 &
REC=$!; sleep 1.5
"$@"
sleep 1
kill -INT $REC; wait $REC 2>/dev/null
python3 -I ${0:a:h}/analyze.py $OUT/run.mov --out $OUT $OPTS
