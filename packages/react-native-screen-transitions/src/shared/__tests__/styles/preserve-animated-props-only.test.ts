import { describe, expect, it } from "bun:test";
import { NO_STYLES } from "../../constants";
import { preserveAnimatedPropsOnly } from "../../providers/screen/styles/helpers/preserve-animated-props-only";

describe("preserveAnimatedPropsOnly", () => {
	it("drops style buckets while preserving animated props", () => {
		const props = { intensity: 42 };

		expect(
			preserveAnimatedPropsOnly({
				content: {
					style: {
						opacity: 0.5,
					},
				},
				backdrop: {
					style: {
						opacity: 0.25,
					},
					props,
				},
				surface: {
					props: {
						pointerEvents: "none",
					},
				},
			}),
		).toEqual({
			backdrop: {
				props,
			},
			surface: {
				props: {
					pointerEvents: "none",
				},
			},
		});
	});

	it("returns the shared empty style map when no props exist", () => {
		expect(
			preserveAnimatedPropsOnly({
				content: {
					style: {
						opacity: 0.5,
					},
				},
			}),
		).toBe(NO_STYLES);
	});
});
