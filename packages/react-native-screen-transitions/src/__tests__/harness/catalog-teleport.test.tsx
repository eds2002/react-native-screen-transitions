import { it } from "bun:test";
import { installHarness } from "./install";

// react-native-teleport installed (most apps): every boundary escapes clipping into its screen's
// overlay host during a transition, and handoff moves content between screens.
const sim = installHarness({ teleport: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { runCatalog } = await import("./catalog-runner");

it("runs the generated catalog with react-native-teleport (iOS, 390×844, 60 Hz)", async () => {
	await runCatalog(sim, { label: "teleport" });
}, 600_000);
