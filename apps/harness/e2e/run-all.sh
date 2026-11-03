#!/bin/zsh
# Runs every e2e scenario on a booted simulator with the Release harness app open, recording each one,
# then writes <outDir>/review.html (open it in a browser) and <outDir>/summary.json.
#   run-all.sh <udid> <outDir> [name filter]
U=$1; OUT=${2:a}; FILTER=${3:-}; E=${0:a:h}
mkdir -p $OUT
# name | lab | path the lab starts on | analyzer options | scenario and arguments
RUNS=(
  "regrab-spring-back-60|gestures|home|--track x@0.7|regrab-spring-back.sh 60"
  "regrab-spring-back-100|gestures|home|--track x@0.7|regrab-spring-back.sh 100"
  "regrab-spring-back-150|gestures|home|--track x@0.7|regrab-spring-back.sh 150"
  "stack-spam-alt-60|stack|A|--track x@0.7|stack-spam.sh 25 60 alt"
  "stack-spam-alt-100|stack|A|--track x@0.7|stack-spam.sh 25 100 alt"
  "stack-spam-alt-150|stack|A|--track x@0.7|stack-spam.sh 25 150 alt"
  "stack-spam-alt-250|stack|A|--track x@0.7|stack-spam.sh 25 250 alt"
  "stack-spam-alt-400|stack|A|--track x@0.7|stack-spam.sh 25 400 alt"
  "stack-spam-burst-100|stack|A|--track x@0.7|stack-spam.sh 25 100 burst"
  "grab-mid-push-letgo-40|stack|A|--track x@0.7|stack-grab-mid-push.sh 40 letgo"
  "grab-mid-push-letgo-80|stack|A|--track x@0.7|stack-grab-mid-push.sh 80 letgo"
  "grab-mid-push-letgo-120|stack|A|--track x@0.7|stack-grab-mid-push.sh 120 letgo"
  "grab-mid-push-dismiss-120|stack|A|--track x@0.7|stack-grab-mid-push.sh 120 dismiss"
  "grab-mid-push-dismiss-180|stack|A|--track x@0.7|stack-grab-mid-push.sh 180 dismiss"
  "ownership-spam-400|ownership|home|--track x@0.7 --track y@0.975|ownership-spam.sh 400"
  "ownership-spam-150|ownership|home|--track x@0.7 --track y@0.975|ownership-spam.sh 150"
  "ownership-spam-50|ownership|home|--track x@0.7 --track y@0.975|ownership-spam.sh 50"
  "sheet-spring-back-60|sheet|Home|--track y@0.975|sheet-regrab.sh 60 spring-back"
  "sheet-spring-back-150|sheet|Home|--track y@0.975|sheet-regrab.sh 150 spring-back"
  "sheet-during-snap-60|sheet|Home|--track y@0.975|sheet-regrab.sh 60 during-snap"
  "sheet-during-snap-150|sheet|Home|--track y@0.975|sheet-regrab.sh 150 during-snap"
  "sheet-during-snap-250|sheet|Home|--track y@0.975|sheet-regrab.sh 250 during-snap"
)
open_lab() {  # open_lab <lab> <startPath>: fresh lab instance on its first screen
  [[ $($E/state.sh $U) == *'"lab":null'* ]] || { $E/tap.sh $U exit-lab; sleep 0.8; }
  $E/tap.sh $U open-$1 && $E/wait-settled.sh $U $2
}
for run in $RUNS; do
  IFS='|' read NAME LAB START OPTS CMD <<< "$run"
  [[ -n $FILTER && $NAME != *$FILTER* ]] && continue
  open_lab $LAB $START || { echo "$NAME: could not open lab $LAB" >&2; continue; }
  SCRIPT=${CMD%% *}; ARGS=${CMD#* }
  $E/visual/record.sh $U $OUT/$NAME ${=OPTS} -- $E/scenarios/$SCRIPT $U ${=ARGS} > $OUT/$NAME.out 2>&1
  printf "%-28s %s\n" $NAME "$(grep -E '^\{' $OUT/$NAME.out | sed 's/.*"events": //' | tr -d '{}')"
done
python3 -I $E/visual/review.py $OUT
