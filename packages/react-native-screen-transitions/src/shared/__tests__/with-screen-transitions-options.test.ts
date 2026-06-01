import { describe, expect, it } from "bun:test";
import {
	adaptNativeStackTransitionOptions,
	resolveScreenTransitionOptions,
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
			screenStyleInterpolator,
			presentation: "containedTransparentModal",
			animation: "none",
			headerShown: false,
			gestureEnabled: false,
			enableTransitions: true,
			screenTransition: {
				gestureEnabled: true,
				gestureDirection: "bidirectional",
			},
		});
	});

	it("maps native gesture aliases to official native-stack gesture options", () => {
		const options = adaptNativeStackTransitionOptions({
			enableTransitions: true,
			gestureEnabled: true,
			nativeGestureEnabled: true,
			nativeGestureDirection: "vertical",
			nativeGestureResponseDistance: {
				start: 40,
			},
		});

		expect(options).toEqual({
			presentation: "containedTransparentModal",
			animation: "none",
			headerShown: false,
			gestureEnabled: true,
			gestureDirection: "vertical",
			gestureResponseDistance: {
				start: 40,
			},
			enableTransitions: true,
			screenTransition: {
				gestureEnabled: true,
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
			screenTransition: {
				gestureDirection: "vertical",
			},
		});
	});

	it("merges namespaced transition options for internal descriptors", () => {
		const options = resolveScreenTransitionOptions({
			gestureEnabled: false,
			screenTransition: {
				gestureEnabled: true,
				gestureDirection: "vertical",
			},
		});

		expect(options.gestureEnabled).toBe(true);
		expect(options.gestureDirection).toBe("vertical");
		expect(options.enableTransitions).toBe(true);
	});

	it("leaves non-transition screens unchanged", () => {
		const options = { title: "Profile" };

		expect(resolveScreenTransitionOptions(options)).toBe(options);
	});
});
