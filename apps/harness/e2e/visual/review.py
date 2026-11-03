#!/usr/bin/env python3
"""
Builds <outDir>/review.html from the runs run-all.sh recorded: one row per run (did the
scenario's own checks pass, how many events of each kind), then every flagged event with its
frame strip (the flagged frames outlined in red). Open it in a browser.

  review.py <outDir>
"""
import html, json, os, sys

KINDS = ["blank", "flicker", "jump", "pop-in", "burst", "hitch", "reversal"]
INFO = {"hitch", "reversal"}
NOTE = {
    "blank": "BLANK (magenta) showing: no screen covers part of the window",
    "flicker": "a frame unlike both neighbours (something appears or vanishes for one frame)",
    "jump": "a tracked screen edge steps far off its path in one frame",
    "pop-in": "a screen first appears part-way across the window instead of entering from its edge",
    "burst": "far more pixels change in one frame than around it",
    "hitch": "a jump-sized step across dropped frames (stutter); informational",
    "reversal": "a screen changes direction; informational",
}

out = sys.argv[1]
runs = []
for name in sorted(os.listdir(out)):
    d = os.path.join(out, name)
    if not os.path.isfile(os.path.join(d, "report.json")):
        continue
    report = json.load(open(os.path.join(d, "report.json")))
    scenario = json.load(open(os.path.join(d, "scenario.json"))) if os.path.exists(os.path.join(d, "scenario.json")) else {"exit": None, "log": ""}
    runs.append((name, report, scenario))

def failing(report):
    return sum(1 for e in report["events"] if e["kind"] not in INFO)

rows, sections, summary = [], [], []
for name, report, scenario in sorted(runs, key=lambda r: (r[2]["exit"] == 0, -failing(r[1]), r[0])):
    counts = report["summary"]["events"]
    ok = scenario["exit"] == 0
    summary.append({"run": name, "scenarioOk": ok, "events": counts})
    cells = "".join(f'<td class="{"bad" if counts.get(k) and k not in INFO else ""}">{counts.get(k, 0) or ""}</td>' for k in KINDS)
    rows.append(f'<tr><td><a href="#{name}">{html.escape(name)}</a></td><td class="{"" if ok else "bad"}">{"ok" if ok else "FAILED"}</td>{cells}</tr>')
    items = []
    for e in report["events"]:
        items.append(
            f'<figure class="{e["kind"]}"><figcaption><b>{e["kind"]}</b> at {e["ms"]:.0f} ms, frames {e["first"]}–{e["last"]}, '
            f'peak {e["peak"]:.3g}</figcaption><img loading="lazy" src="{name}/{e["image"]}"></figure>'
        )
    log = f'<pre>{html.escape(scenario["log"].strip())}</pre>' if scenario["log"].strip() else ""
    sections.append(f'<section id="{name}"><h2>{html.escape(name)}</h2>{log}<p><a href="{name}/run.mov">recording</a></p>{"".join(items) or "<p>No events.</p>"}</section>')

legend = "".join(f"<li><b>{k}</b>: {html.escape(v)}</li>" for k, v in NOTE.items())
page = f"""<!doctype html><meta charset="utf-8"><title>Harness visual review</title>
<style>
body{{font:14px -apple-system,system-ui,sans-serif;margin:24px;background:#111;color:#eee}}
table{{border-collapse:collapse}} td,th{{padding:4px 10px;border-bottom:1px solid #333;text-align:left}}
.bad{{color:#ff6b6b;font-weight:700}} a{{color:#8ab4ff}} section{{margin-top:36px}}
figure{{margin:16px 0}} figcaption{{margin-bottom:6px}} img{{max-width:100%;border:1px solid #333}}
figure.hitch,figure.reversal{{opacity:.6}} pre{{color:#ffb4b4;white-space:pre-wrap}}
</style>
<h1>Harness visual review</h1>
<p>Each strip shows recorded frames around an event at half point resolution; flagged frames are outlined in red. Magenta is the blank colour behind every screen.</p>
<ul>{legend}</ul>
<table><tr><th>run</th><th>end state</th>{"".join(f"<th>{k}</th>" for k in KINDS)}</tr>{"".join(rows)}</table>
{"".join(sections)}
"""
open(os.path.join(out, "review.html"), "w").write(page)
json.dump(summary, open(os.path.join(out, "summary.json"), "w"), indent=1)
print(os.path.join(out, "review.html"))
