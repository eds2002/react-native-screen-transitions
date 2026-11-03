#!/usr/bin/env python3
"""
Turns a finger script into Argent gesture-custom events, one Move per 16 ms frame,
so the finger moves smoothly (Argent's own Moves are only as frequent as you list them).

  finger.py "down 0.2,0.6; move 0.5,0.6 300; hold 250; up; wait 80; down 0.45,0.6; move 0.54,0.6 200; up"

  down x,y        touch down
  move x,y ms     move there in ms (linear, a Move every 16 ms)
  hold ms         keep the finger still for ms
  up              lift (16 ms after the last event)
  wait ms         nothing for ms (the next down waits that long)
"""
import json, sys

FRAME = 16
events, pos, pending = [], None, 0
for step in [s.split() for s in sys.argv[1].split(";") if s.strip()]:
    op = step[0]
    if op == "down":
        pos = tuple(map(float, step[1].split(",")))
        events.append({"type": "Down", "x": pos[0], "y": pos[1], "delayMs": pending})
        pending = 0
    elif op == "move":
        to, ms = tuple(map(float, step[1].split(","))), float(step[2])
        n = max(1, round(ms / FRAME))
        for k in range(1, n + 1):
            x, y = pos[0] + (to[0] - pos[0]) * k / n, pos[1] + (to[1] - pos[1]) * k / n
            events.append({"type": "Move", "x": round(x, 4), "y": round(y, 4), "delayMs": FRAME})
        pos = to
    elif op == "hold":
        n = max(1, round(float(step[1]) / FRAME))
        events += [{"type": "Move", "x": pos[0], "y": pos[1], "delayMs": FRAME} for _ in range(n)]
    elif op == "up":
        events.append({"type": "Up", "x": pos[0], "y": pos[1], "delayMs": FRAME + pending})
        pending = 0
    elif op == "wait":
        pending += float(step[1])
print(json.dumps(events))
