import { it } from "bun:test";
import { installHarness } from "./install";

// The deep-chain stress family with handoff (one live payload through five screens and many kinds of
// screen motion), on its own: with Teleport installed it is slow enough to need its own run.
const sim = installHarness({ teleport: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { runCatalog } = await import("./catalog-runner");

it("runs the deep-chain handoff family with react-native-teleport (iOS, 390×844, 60 Hz)", async () => {
	await runCatalog(sim, { label: "teleport-deep", filter: (name) => name.startsWith("bounds-deep-") });
}, 600_000);
