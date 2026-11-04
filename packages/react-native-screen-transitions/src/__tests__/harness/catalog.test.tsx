import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { runCatalog } = await import("./catalog-runner");

it("runs the generated catalog (iOS, 390×844, 60 Hz): every violation is a known issue, every known issue reproduces", async () => {
	await runCatalog(sim, { label: "ios", strictKnownIssues: true });
}, 600_000);
