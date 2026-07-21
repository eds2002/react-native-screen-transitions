import { beforeAll, describe, expect, it, mock } from "bun:test";
import {
	Children,
	createElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import type * as AdapterModule from "../adapters/with-screen-transitions";
import type {
	ScreenLayout,
	ScreenLayoutArgs,
} from "../adapters/with-screen-transitions/types";

const SCREEN_LAYOUT_COMPONENT = "screen-transitions-screen-layout";

mock.module("../adapters/with-screen-transitions/stack-layout", () => ({
	ScreenTransitionsScreenLayout: SCREEN_LAYOUT_COMPONENT,
	ScreenTransitionsStackLayout: "screen-transitions-stack-layout",
}));

let adaptNavigatorChildren: typeof AdapterModule.adaptNavigatorChildren;
let createTransitionScreenLayout: typeof AdapterModule.createTransitionScreenLayout;

type ConfigProps = {
	children?: ReactNode;
	layout?: unknown;
	screenLayout?: unknown;
};

type TransitionLayoutProps = {
	screenLayout?: ScreenLayout;
	screenLayoutArgs: ScreenLayoutArgs;
};

function Config(_props: ConfigProps) {
	return null;
}

function getOnlyConfig(node: ReactNode): ReactElement<ConfigProps> {
	const children = Children.toArray(node);

	if (children.length !== 1 || !isValidElement<ConfigProps>(children[0])) {
		throw new Error("Expected exactly one route config element");
	}

	return children[0];
}

function getTransitionLayout(
	element: ReactElement,
): ReactElement<TransitionLayoutProps> {
	if (
		!isValidElement<TransitionLayoutProps>(element) ||
		element.type !== SCREEN_LAYOUT_COMPONENT
	) {
		throw new Error("Expected a screen transition layout element");
	}

	return element;
}

function createLayoutArgs(routeKey = "detail"): ScreenLayoutArgs {
	return {
		route: { key: routeKey },
		navigation: {},
		options: {},
		theme: {},
		children: createElement(Config),
	};
}

describe("withScreenTransitions layouts", () => {
	beforeAll(async () => {
		const adapter = await import("../adapters/with-screen-transitions");

		adaptNavigatorChildren = adapter.adaptNavigatorChildren;
		createTransitionScreenLayout = adapter.createTransitionScreenLayout;
	});

	it("wraps a per-screen layout with the transition screen layout", () => {
		const userLayout: ScreenLayout = ({ children }) =>
			createElement(Config, null, children);
		const screen = createElement(Config, { layout: userLayout });
		const adaptedScreen = getOnlyConfig(adaptNavigatorChildren(screen));
		const adaptedLayout = adaptedScreen.props.layout;

		expect(typeof adaptedLayout).toBe("function");
		expect(adaptedLayout).not.toBe(userLayout);

		const layoutArgs = createLayoutArgs();
		const transitionLayout = getTransitionLayout(
			(adaptedLayout as ScreenLayout)(layoutArgs),
		);

		expect(transitionLayout.props.screenLayout).toBe(userLayout);
		expect(transitionLayout.props.screenLayoutArgs).toBe(layoutArgs);
	});

	it("wraps group and nested screen layout overrides", () => {
		const groupLayout: ScreenLayout = ({ children }) =>
			createElement(Config, null, children);
		const screenLayout: ScreenLayout = ({ children }) =>
			createElement(Config, null, children);
		const group = createElement(
			Config,
			{ screenLayout: groupLayout },
			createElement(Config, { layout: screenLayout }),
			createElement(Config),
		);
		const adaptedGroup = getOnlyConfig(adaptNavigatorChildren(group));
		const adaptedGroupLayout = adaptedGroup.props.screenLayout;

		expect(typeof adaptedGroupLayout).toBe("function");
		const groupLayoutArgs = createLayoutArgs();
		const groupTransitionLayout = getTransitionLayout(
			(adaptedGroupLayout as ScreenLayout)(groupLayoutArgs),
		);
		expect(groupTransitionLayout.props.screenLayout).toBe(groupLayout);

		const nestedScreens = Children.toArray(adaptedGroup.props.children);
		const nestedScreen = getOnlyConfig(nestedScreens[0]);
		const nestedScreenWithoutLayout = getOnlyConfig(nestedScreens[1]);
		const adaptedScreenLayout = nestedScreen.props.layout;

		expect(typeof adaptedScreenLayout).toBe("function");
		const screenLayoutArgs = createLayoutArgs();
		const screenTransitionLayout = getTransitionLayout(
			(adaptedScreenLayout as ScreenLayout)(screenLayoutArgs),
		);
		expect(screenTransitionLayout.props.screenLayout).toBe(screenLayout);
		expect(nestedScreenWithoutLayout.props.layout).toBeUndefined();
	});

	it("leaves non-function layout values untouched", () => {
		const groupLayoutSentinel = {};
		const config = createElement(Config, {
			layout: undefined,
			screenLayout: groupLayoutSentinel,
		});
		const adaptedConfig = getOnlyConfig(adaptNavigatorChildren(config));

		expect(adaptedConfig.props.layout).toBeUndefined();
		expect(adaptedConfig.props.screenLayout).toBe(groupLayoutSentinel);
	});

	it("creates the navigator screen layout without a user override", () => {
		const layoutArgs = createLayoutArgs();
		const transitionLayout = getTransitionLayout(
			createTransitionScreenLayout()(layoutArgs),
		);

		expect(transitionLayout.props.screenLayout).toBeUndefined();
		expect(transitionLayout.props.screenLayoutArgs).toBe(layoutArgs);
	});
});
