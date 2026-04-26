import { describe, expect, it } from "bun:test";
import { stripInterpolatorConfig } from "../providers/screen/styles/helpers/strip-interpolator-config";

describe("stripInterpolatorConfig", () => {
	it("strips the runtime gesture config block", () => {
		const content = { opacity: 0.5 };
		const raw = {
			config: { gestureSensitivity: 0.75 },
			content,
		};

		expect(stripInterpolatorConfig(raw)).toEqual({ content });
	});

	it("preserves a custom style slot named config", () => {
		const config = {
			style: { opacity: 0.5 },
		};
		const raw = {
			config,
			content: { opacity: 1 },
		};

		expect(stripInterpolatorConfig(raw)).toEqual(raw);
	});
});
