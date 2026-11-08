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
  pinch x,y d0,d1 ms   two fingers about x,y, d0 apart (fraction of the width), to d1 apart in ms
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
    elif op == "pinch":
        (cx, cy), (d0, d1), ms = map(float, step[1].split(",")), map(float, step[2].split(",")), float(step[3])
        n = max(1, round(ms / FRAME))
        two = lambda d: {"x": round(cx - d / 2, 4), "y": cy, "x2": round(cx + d / 2, 4), "y2": cy}
        events.append({"type": "Down", **two(d0), "delayMs": pending})
        events += [{"type": "Move", **two(d0 + (d1 - d0) * k / n), "delayMs": FRAME} for k in range(1, n + 1)]
        events.append({"type": "Up", **two(d1), "delayMs": FRAME})
        pending, pos = 0, (cx, cy)
    elif op == "wait":
        pending += float(step[1])
print(json.dumps(events))
