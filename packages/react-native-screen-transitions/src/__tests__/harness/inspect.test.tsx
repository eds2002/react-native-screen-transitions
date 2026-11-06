/**
 * Prints one catalog scenario's trace for a scene, frame by frame:
 *   SCENARIO="slide-horizontal / preset-spec / rapid" SCENE=B bun test inspect
 * Optional: FROM/TO (trace indexes), LAYERS=1 (each layer's transform),
 * ORDER=1 (paint order of scenes per frame), ELEMENT=<id> (one element's rect; ELEMENT_STYLE=1 adds its transform and opacity), TELEPORT=1 (react-native-teleport installed), ANDROID=1 (the Android catalog's window). Skipped without SCENARIO.
 */
import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness(
	process.env.ANDROID
		? { os: "android", window: { width: 412, height: 915 }, insets: { top: 24, right: 0, bottom: 0, left: 0 }, teleport: !!process.env.TELEPORT }
		: { teleport: !!process.env.TELEPORT },
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const name = process.env.SCENARIO;

it.skipIf(!name)("inspect a catalog scenario", async () => {
	const { runScenario } = await import("./scenario");
	const { buildFullCatalog } = await import("./catalog");
	const { WINDOW } = await import("./install");
	const { HarnessOverlay } = await import("./stack-harness");
	const presets = await import("../../configs/presets");
	const { interpolate } = await import("react-native-reanimated");
	const scenario = buildFullCatalog(presets as never, interpolate as never, WINDOW, HarnessOverlay, (await import("../../configs/specs")) as never).find((s) => s.name === name);
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
		const element = process.env.ELEMENT ? scene.elements[process.env.ELEMENT] : undefined;
		const elementText = element
			? ` | ${process.env.ELEMENT} x=${element.rect.x.toFixed(1)} y=${element.rect.y.toFixed(1)} w=${element.rect.width.toFixed(0)} o=${element.opacity.toFixed(2)}` +
				(process.env.ELEMENT_STYLE ? ` ${JSON.stringify(element.style.transform ?? "")} o=${element.style.opacity ?? ""}` : "")
			: "";
		console.log(`${i} f${result.trace[i].frame} x=${x.toFixed(1)} y=${y.toFixed(1)} w=${width.toFixed(0)} o=${scene.opacity.toFixed(2)} touch=${scene.touchable} ${layers}${elementText}`);
	}
});
