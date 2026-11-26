import { describe, expect, it } from "bun:test";
import { createBlankStackProps } from "../navigators/expo-router/create-blank-stack-props";

const route = (key: string) => ({ key, name: key });

const navigation = {
	getState: () => ({ key: "stack", index: 0, routes: [] }),
	dispatch: () => {},
};

describe("createBlankStackProps", () => {
	it("passes the state through when no routes follow the focused route", () => {
		const state = { key: "stack", index: 1, routes: [route("a"), route("b")] };

		const props = createBlankStackProps({ state, navigation });

		expect(props.navigationState).toBe(state);
		expect(props.navigation).toBe(navigation);
	});

	it("separates preloaded routes from the active stack", () => {
		const a = route("a");
		const b = route("b");
		const preloaded = { ...route("preloaded"), isPreloaded: true };
		const state = {
			key: "stack",
			index: 1,
			routes: [a, b, preloaded],
		};

		const props = createBlankStackProps({ state, navigation });

		expect(props.navigationState).toEqual({
			key: "stack",
			index: 1,
			routes: [a, b],
			preloadedRoutes: [preloaded],
		});
	});
});
