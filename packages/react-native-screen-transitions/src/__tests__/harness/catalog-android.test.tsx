import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness({ os: "android", window: { width: 412, height: 915 }, insets: { top: 24, right: 0, bottom: 0, left: 0 } });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { runCatalog } = await import("./catalog-runner");

it("runs the generated catalog on Android (412×915, 60 Hz)", async () => {
	await runCatalog(sim, { label: "android" });
}, 600_000);
