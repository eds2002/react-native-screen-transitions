import { describe, expect, it } from "bun:test";
import { transformSync } from "@babel/core";
import { readFileSync } from "node:fs";

// Test the emitted closures: Reanimated discovers mapper subscriptions from
// these objects, including every shared value in any captured plain object.
function getVisibilityClosures() {
	const filename = new URL(
		"../../providers/motion/hooks/use-maybe-block-visibility.tsx",
		import.meta.url,
	);
	const closures: string[][] = [];
	transformSync(readFileSync(filename, "utf8"), {
		filename: filename.pathname,
		babelrc: false,
		configFile: false,
		plugins: [
			"@babel/plugin-transform-typescript",
			"react-native-worklets/plugin",
			() => ({
				visitor: {
					AssignmentExpression(path: {
						node: {
							left: { type: string; property?: { name?: string } };
							right: {
								type: string;
								properties?: { key: { name: string } }[];
							};
						};
					}) {
						const { left, right } = path.node;
						if (
							left.type === "MemberExpression" &&
							left.property?.name === "__closure" &&
							right.type === "ObjectExpression"
						) {
							closures.push(
								(right.properties ?? []).map((property) => property.key.name),
							);
						}
					},
				},
			}),
		],
	});
	return closures;
}

describe("visibility worklet subscriptions", () => {
	it("keeps visibility clocks without subscribing to the entire gesture state", () => {
		const closures = getVisibilityClosures();
		expect(closures.length).toBeGreaterThanOrEqual(5);
		for (const closure of closures) expect(closure).not.toContain("motion");

		const gate = closures.find((closure) =>
			closure.includes("resolveScreenVisibilityGate"),
		);
		expect(gate).toContain("entering");
		expect(gate).toContain("pendingLifecycleStartBlockCount");
		expect(gate).toContain("animationProgress");

		const ready = closures.find((closure) =>
			closure.includes("resolveScreenReady"),
		);
		expect(ready).toContain("entering");
		expect(ready).toContain("closing");
		expect(ready).toContain("ancestorIsScreenReady");

		const style = closures.find((closure) =>
			closure.includes("hasCloseTransitionFinished"),
		);
		expect(style).toContain("closing");
		expect(style).toContain("animationProgress");
	});
});
