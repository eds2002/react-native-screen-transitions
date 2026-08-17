import { describe, expect, it } from "bun:test";
import {
	adaptNativeStackTransitionOptions,
	resolveAdapterTransitionOptions,
} from "../adapters/with-screen-transitions/options";

function stringProps(options: Record<string, unknown>) {
	return Object.fromEntries(Object.entries(options));
}

describe("withScreenTransitions options", () => {
	it("adapts native-stack-shaped transition options before React Navigation sees them", () => {
		const screenStyleInterpolator = () => null;
		const options = adaptNativeStackTransitionOptions({
			title: "Avatar",
			enableTransitions: true,
			gestureEnabled: true,
			gestureDirection: "bidirectional",
			screenStyleInterpolator,
		});

		expect(stringProps(options)).toEqual({
			title: "Avatar",
			screenStyleInterpolator,
			presentation: "containedTransparentModal",
			animation: "none",
			headerShown: false,
			gestureEnabled: false,
			enableTransitions: true,
		});

		const resolvedOptions = resolveAdapterTransitionOptions(options);

		expect(resolvedOptions.gestureEnabled).toBe(true);
		expect(resolvedOptions.gestureDirection).toBe("bidirectional");
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

		expect(stringProps(options())).toEqual({
			presentation: "containedTransparentModal",
			animation: "none",
			headerShown: false,
			gestureEnabled: false,
			enableTransitions: true,
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
		expect(options.gestureDirection).toBeUndefined();
		expect(resolvedOptions.gestureEnabled).toBeUndefined();
		expect(resolvedOptions.gestureDirection).toBe("vertical");
	});

	it("restores transition-only gesture options after React Navigation merges descriptors", () => {
		const options = adaptNativeStackTransitionOptions({
			enableTransitions: true,
			gestureEnabled: true,
			gestureDirection: "bidirectional",
		});
		const mergedOptions = Object.assign({}, options);
		const resolvedOptions = resolveAdapterTransitionOptions(mergedOptions);

		expect(mergedOptions.gestureDirection).toBeUndefined();
		expect(resolvedOptions.gestureEnabled).toBe(true);
		expect(resolvedOptions.gestureDirection).toBe("bidirectional");
	});

	it("preserves inherited adapter gesture options through screen option merges", () => {
		const screenOptions = adaptNativeStackTransitionOptions({
			enableTransitions: true,
			gestureEnabled: true,
			gestureDirection: "vertical",
		});
		const screenSpecificOptions = adaptNativeStackTransitionOptions({
			enableTransitions: true,
			title: "Avatar",
		});
		const mergedOptions = Object.assign({}, screenOptions, screenSpecificOptions);
		const resolvedOptions = resolveAdapterTransitionOptions(mergedOptions);

		expect(mergedOptions.gestureDirection).toBeUndefined();
		expect(resolvedOptions.gestureEnabled).toBe(true);
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
