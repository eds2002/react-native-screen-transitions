#!/bin/zsh
# Waits until the harness reports every screen settled (and, if given, the focused path).
#   wait-settled.sh <udid> [path] [timeoutSeconds=8]   exits 1 on timeout, printing the last state
U=$1; WANT=$2; END=$((SECONDS + ${3:-8}))
while (( SECONDS < END )); do
  S=$(${0:a:h}/state.sh $U)
  if [[ $S == *'"settled":true'* ]] && { [[ -z $WANT ]] || [[ $S == *"\"path\":\"$WANT\""* ]]; }; then exit 0; fi
  sleep 0.2
done
echo "wait-settled: timed out (want path '${WANT}'): $S" >&2; exit 1
