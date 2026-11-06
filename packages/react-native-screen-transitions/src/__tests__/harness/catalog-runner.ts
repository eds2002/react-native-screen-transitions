/**
 * Runs the full catalog under whatever environment the calling test file
 * installed, and checks every violation against the known issues. Each
 * environment is its own test file (module stand-ins are per process).
 */
import { expect } from "bun:test";
import type { ReanimatedSim } from "./reanimated-sim";

/**
 * `strictKnownIssues`: also fail when a known issue does not reproduce (the
 * default environment only; how an issue shows can depend on window size and
 * display rate).
 */
export const runCatalog = async (
	sim: ReanimatedSim,
	{ label = "catalog", strictKnownIssues = false }: { label?: string; strictKnownIssues?: boolean } = {},
) => {
	const { runScenario } = await import("./scenario");
	const { buildFullCatalog } = await import("./catalog");
	const { WINDOW } = await import("./install");
	const { HarnessOverlay } = await import("./stack-harness");
	const { KNOWN_ISSUES } = await import("./known-issues");
	const presets = await import("../../configs/presets");
	const { interpolate } = await import("react-native-reanimated");
	// HARNESS_ONLY=<substring> runs the matching scenarios only (known issues outside them can't reproduce, so strictness is off).
	const only = process.env.HARNESS_ONLY;
	const catalog = buildFullCatalog(presets as never, interpolate as never, WINDOW, HarnessOverlay, (await import("../../configs/specs")) as never).filter(
		(scenario) => !only || scenario.name.includes(only),
	);

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
			unexplained.push(`${scenario.name}: ${violation.rule} @${violation.frame} ${violation.scene ?? ""} ${violation.detail.slice(0, 200)}`);
		}
	}
	if (process.env.HARNESS_REPORT) {
		await Bun.write(process.env.HARNESS_REPORT.replace(/(\.json)?$/, `.${label}.json`), JSON.stringify(report, null, 1));
	}
	const fixed = KNOWN_ISSUES.filter((issue) => !seen.has(issue.id)).map((issue) => issue.id);
	if (unexplained.length) console.log(`[${label}] unexplained violations:\n${unexplained.join("\n")}`);
	if (fixed.length) console.log(`[${label}] known issues that no longer reproduce (delete them): ${fixed.join(", ")}`);
	expect(unexplained).toEqual([]);
	if (strictKnownIssues && !only) expect(fixed).toEqual([]);
	return catalog.length;
};
