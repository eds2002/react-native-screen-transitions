import { describe, expect, it } from "bun:test";
import {
	adaptNativeStackTransitionOptions,
	resolveAdapterTransitionOptions,
} from "../adapters/with-screen-transitions/options";

describe("withScreenTransitions options", () => {
	it("adapts native-stack-shaped transition options before React Navigation sees them", () => {
		const screenStyleInterpolator = () => null;
		const options = adaptNativeStackTransitionOptions({
			title: "Avatar",
			enableTransitions: true,
			gestureEnabled: true,
			gestureDirection: "bidirectional",
			gestureProgressMode: "freeform",
			screenStyleInterpolator,
		});

		expect(options).toEqual({
			title: "Avatar",
			gestureProgressMode: "freeform",
			gestureDirection: "bidirectional",
			screenStyleInterpolator,
			presentation: "containedTransparentModal",
			animation: "none",
			headerShown: false,
			gestureEnabled: false,
			enableTransitions: true,
		});

		expect(resolveAdapterTransitionOptions(options).gestureEnabled).toBe(true);
	});

	it("leaves native-stack gesture options unchanged when transitions are disabled", () => {
		const options = adaptNativeStackTransitionOptions({
			title: "Avatar",
			gestureEnabled: true,
			gestureDirection: "vertical",
			gestureResponseDistance: {
				start: 40,
			},
		});

		expect(options).toEqual({
			title: "Avatar",
			gestureEnabled: true,
			gestureDirection: "vertical",
			gestureResponseDistance: {
				start: 40,
			},
		});
	});

	it("adapts functional options", () => {
		const options = adaptNativeStackTransitionOptions(() => ({
			enableTransitions: true,
			gestureDirection: "vertical",
		}));

		expect(options()).toEqual({
			presentation: "containedTransparentModal",
			animation: "none",
			headerShown: false,
			gestureEnabled: false,
			enableTransitions: true,
			gestureDirection: "vertical",
		});
	});

	it("restores adapted transition options for internal descriptors", () => {
		const options = adaptNativeStackTransitionOptions({
			enableTransitions: true,
			gestureEnabled: true,
			gestureDirection: "vertical",
		});
		const resolvedOptions = resolveAdapterTransitionOptions(options);

		expect(resolvedOptions.gestureEnabled).toBe(true);
		expect(resolvedOptions.gestureDirection).toBe("vertical");
		expect(resolvedOptions.enableTransitions).toBe(true);
	});

	it("does not leak the native gesture reset into transition options", () => {
		const options = adaptNativeStackTransitionOptions({
			enableTransitions: true,
			gestureDirection: "vertical",
		});
		const resolvedOptions = resolveAdapterTransitionOptions(options);

		expect(options.gestureEnabled).toBe(false);
		expect(resolvedOptions.gestureEnabled).toBeUndefined();
		expect(resolvedOptions.gestureDirection).toBe("vertical");
	});

	it("leaves unadapted transition options unchanged", () => {
		const options = {
			gestureEnabled: false,
		};

		expect(resolveAdapterTransitionOptions(options)).toBe(options);
	});

	it("leaves non-transition screens unchanged", () => {
		const options = { title: "Profile" };

		expect(resolveAdapterTransitionOptions(options)).toBe(options);
	});
});
