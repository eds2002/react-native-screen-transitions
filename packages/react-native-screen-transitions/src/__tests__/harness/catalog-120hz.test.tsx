import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness({ frameMs: 1000 / 120 });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { runCatalog } = await import("./catalog-runner");

it("runs the generated catalog at 120 Hz (iOS, 390×844)", async () => {
	await runCatalog(sim, { label: "120hz" });
}, 600_000);
