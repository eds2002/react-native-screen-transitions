import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { runScenario } = await import("./scenario");
const { buildFullCatalog } = await import("./catalog");
const { WINDOW } = await import("./install");
const { HarnessOverlay } = await import("./stack-harness");
const { KNOWN_ISSUES } = await import("./known-issues");
const presets = await import("../../configs/presets");
const { interpolate } = await import("react-native-reanimated");

const catalog = buildFullCatalog(presets as never, interpolate as never, WINDOW, HarnessOverlay);

it(`runs the ${catalog.length} generated scenarios: every violation is a known issue, and every known issue still reproduces`, async () => {
	const unexplained: string[] = [];
	const seen = new Map<string, number>();
	const report: unknown[] = [];
	for (const scenario of catalog) {
		const result = await runScenario(sim, scenario);
		if (result.violations.length) {
			report.push({ name: scenario.name, routes: result.routes.map((r) => r.name), violations: result.violations });
		}
		for (const violation of result.violations) {
			const issue = KNOWN_ISSUES.find((known) => known.matches(scenario.name, violation));
			if (issue) {
				seen.set(issue.id, (seen.get(issue.id) ?? 0) + 1);
				continue;
			}
			unexplained.push(
				`${scenario.name}: ${violation.rule} @${violation.frame} ${violation.scene ?? ""} ${violation.detail.slice(0, 200)}`,
			);
		}
	}
	if (process.env.HARNESS_REPORT) {
		await Bun.write(process.env.HARNESS_REPORT, JSON.stringify(report, null, 1));
	}
	const fixed = KNOWN_ISSUES.filter((issue) => !seen.has(issue.id)).map((issue) => issue.id);
	if (unexplained.length) console.log(`unexplained violations:\n${unexplained.join("\n")}`);
	if (fixed.length) console.log(`known issues that no longer reproduce (delete them): ${fixed.join(", ")}`);
	expect(unexplained).toEqual([]);
	expect(fixed).toEqual([]);
}, 600_000);
