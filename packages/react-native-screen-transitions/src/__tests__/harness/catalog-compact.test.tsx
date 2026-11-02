import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness({ window: { width: 320, height: 568 }, insets: { top: 20, right: 0, bottom: 0, left: 0 } });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { runCatalog } = await import("./catalog-runner");

it("runs the generated catalog on a compact screen (iOS, 320×568, 60 Hz)", async () => {
	await runCatalog(sim, { label: "compact" });
}, 600_000);
