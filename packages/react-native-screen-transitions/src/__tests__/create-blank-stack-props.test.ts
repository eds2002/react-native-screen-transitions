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

	it("drops preloaded routes that follow the focused route", () => {
		const a = route("a");
		const b = route("b");
		const state = {
			key: "stack",
			index: 1,
			routes: [a, b, { ...route("preloaded"), isPreloaded: true }],
		};

		const props = createBlankStackProps({ state, navigation });

		expect(props.navigationState).toEqual({
			key: "stack",
			index: 1,
			routes: [a, b],
		});
	});
});
