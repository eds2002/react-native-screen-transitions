#!/bin/zsh
# Records the simulator while a scenario runs, then analyzes the recording.
#   record.sh <udid> <outDir> [analyze.py options] -- <scenario command...>
# Writes <outDir>/run.mov, report.json, event-*.png and scenario.json ({"exit": n, "log": "..."}).
# Exits non-zero if the scenario's own checks failed or the analyzer flagged a failure.
U=$1; OUT=$2; shift 2
OPTS=(); while [[ $# -gt 0 && $1 != "--" ]]; do OPTS+=$1; shift; done; shift
mkdir -p $OUT
xcrun simctl io $U recordVideo --codec=h264 --force $OUT/run.mov >/dev/null 2>&1 &
REC=$!; sleep 1.5
"$@" 2> $OUT/scenario.log; SC=$?
sleep 1
kill -INT $REC; wait $REC 2>/dev/null
python3 -I -c 'import json,sys; json.dump({"exit": int(sys.argv[1]), "log": open(sys.argv[2]).read()}, open(sys.argv[3], "w"))' $SC $OUT/scenario.log $OUT/scenario.json
cat $OUT/scenario.log >&2
python3 -I ${0:a:h}/analyze.py $OUT/run.mov --out $OUT $OPTS 2> >(grep -v dts >&2); AN=$?
(( SC != 0 )) && exit 2
exit $AN
