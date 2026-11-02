/**
 * Prints one catalog scenario's trace for a scene, frame by frame:
 *   SCENARIO="slide-horizontal / preset-spec / rapid" SCENE=B bun test inspect
 * Optional: FROM/TO (trace indexes), LAYERS=1 (each layer's transform),
 * ORDER=1 (paint order of scenes per frame). Skipped without SCENARIO.
 */
import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const name = process.env.SCENARIO;

it.skipIf(!name)("inspect a catalog scenario", async () => {
	const { runScenario } = await import("./scenario");
	const { buildFullCatalog } = await import("./catalog");
	const { WINDOW } = await import("./install");
	const { HarnessOverlay } = await import("./stack-harness");
	const presets = await import("../../configs/presets");
	const { interpolate } = await import("react-native-reanimated");
	const scenario = buildFullCatalog(presets as never, interpolate as never, WINDOW, HarnessOverlay).find((s) => s.name === name);
	if (!scenario) throw new Error(`no scenario named "${name}"`);
	const result = await runScenario(sim, scenario);
	const from = Number(process.env.FROM ?? 0);
	const to = Number(process.env.TO ?? result.trace.length);
	const sceneName = process.env.SCENE ?? "B";
	for (const v of result.violations) {
		console.log(`violation ${v.rule} at trace ${result.trace.findIndex((f) => f.frame === v.frame)} ${v.scene ?? ""}: ${v.detail.slice(0, 160)}`);
	}
	if (process.env.ORDER) {
		console.log(result.trace.slice(from, to).map((f, i) => `${from + i}:${f.scenes.map((s) => s.name).join("")}`).join(" "));
	}
	for (let i = from; i < Math.min(to, result.trace.length); i++) {
		const scene = result.trace[i].scenes.find((s) => s.name === sceneName);
		if (!scene) {
			console.log(`${i} -`);
			continue;
		}
		const { x, y, width } = scene.rect;
		const layers = process.env.LAYERS
			? scene.layers.map((l) => JSON.stringify(l.style.transform ?? "") + (l.style.opacity !== undefined ? ` o=${l.style.opacity}` : "")).join(" | ")
			: "";
		console.log(`${i} x=${x.toFixed(1)} y=${y.toFixed(1)} w=${width.toFixed(0)} o=${scene.opacity.toFixed(2)} touch=${scene.touchable} ${layers}`);
	}
});
