import { TestStackLayout, TestScreenLayout } from "./helpers/adapter-layouts";
import { beforeAll, describe, expect, it, mock } from "bun:test";
import {
	BaseNavigationContainer,
	createNavigatorFactory,
	useNavigationBuilder,
} from "@react-navigation/core";
import { createElement, memo } from "react";
import { StackRouter } from "@react-navigation/routers";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import type * as Adapter from "../adapters/with-screen-transitions";
import { resolveAdapterTransitionOptions } from "../adapters/with-screen-transitions/options";

mock.module("../adapters/with-screen-transitions/stack-layout", () => ({
	ScreenTransitionsScreenLayout: TestScreenLayout,
	ScreenTransitionsStackLayout: TestStackLayout,
}));

let withScreenTransitions: typeof Adapter.withScreenTransitions;
const Screen = () => null;
const Navigator = () => null;
const factory = createNavigatorFactory(Navigator);
const layout = ({ children }: any) => createElement("layout", null, children);
const layoutArgs = { children: null, route: { key: "home" } };

describe("withScreenTransitions factory", () => {
	beforeAll(async () => {
		({ withScreenTransitions } = await import(
			"../adapters/with-screen-transitions"
		));
	});

	it("keeps existing navigator wrapping and supports a factory without config", () => {
		const original = factory();
		const existing = withScreenTransitions(original);
		const createStack = withScreenTransitions(factory);
		const dynamic = createStack();
		expect(existing.Navigator).not.toBe(Navigator);
		expect(dynamic.Navigator).not.toBe(Navigator);
		expect(dynamic.Screen).toBe(original.Screen);
		expect(dynamic.Group).toBe(original.Group);
	});

	it("adapts static options and composes every layout without mutating the config", () => {
		const useSignedIn = () => true;
		const getId = ({ params }: any) => params.id;
		const listeners = { focus: () => {} };
		const nested = factory({ screens: { Inner: Screen } });
		const MemoScreen = memo(Screen);
		const options = {
			enableTransitions: true,
			gestureEnabled: true,
			gestureDirection: "pinch-in",
		};
		const config = {
			layout,
			screenLayout: layout,
			screenOptions: options,
			screens: {
				Home: Screen,
				Memo: MemoScreen,
				Nested: nested,
				Detail: {
					screen: Screen,
					if: useSignedIn,
					linking: "detail/:id",
					getId,
					listeners,
					layout,
					options,
				},
			},
			groups: {
				Auth: {
					if: useSignedIn,
					screenLayout: layout,
					screenOptions: () => options,
					screens: {
						Profile: { screen: Screen, options: () => options },
						Nested: { screen: nested },
					},
				},
			},
		};
		const staticStack = withScreenTransitions(factory)(config);
		const adapted = staticStack.config;
		expect(typeof staticStack.getComponent()).toBe("function");
		expect(typeof staticStack.with).toBe("function");
		expect(adapted).not.toBe(config);
		expect(adapted.layout(layoutArgs).props.layout).toBe(layout);
		expect(adapted.screenLayout(layoutArgs).props.screenLayout).toBe(layout);
		expect(adapted.screens.Detail.layout(layoutArgs).props.screenLayout).toBe(
			layout,
		);
		expect(
			adapted.groups.Auth.screenLayout(layoutArgs).props.screenLayout,
		).toBe(layout);
		expect(adapted.screenOptions).toMatchObject({
			animation: "none",
			gestureEnabled: false,
		});
		expect(
			resolveAdapterTransitionOptions(adapted.screens.Detail.options),
		).toMatchObject(options);
		expect(
			resolveAdapterTransitionOptions(adapted.groups.Auth.screenOptions()),
		).toMatchObject(options);
		expect(
			resolveAdapterTransitionOptions(
				adapted.groups.Auth.screens.Profile.options(),
			),
		).toMatchObject(options);
		expect(adapted.screens.Detail.if).toBe(useSignedIn);
		expect(adapted.screens.Detail.getId).toBe(getId);
		expect(adapted.screens.Detail.listeners).toBe(listeners);
		expect(adapted.screens.Detail.linking).toBe("detail/:id");
		expect(adapted.groups.Auth.if).toBe(useSignedIn);
		expect(adapted.screens.Home).toBe(Screen);
		expect(adapted.screens.Memo).toBe(MemoScreen);
		expect(adapted.screens.Nested).toBe(nested);
		expect(adapted.groups.Auth.screens.Nested.screen).toBe(nested);
		expect(config.screenOptions).toBe(options);
		expect(config.screens.Detail.layout).toBe(layout);
		expect(config.groups.Auth.screenLayout).toBe(layout);
		expect(options.gestureEnabled).toBe(true);
	});

	it("installs default layouts for groups-only config and preserves registration order", () => {
		const config = {
			groups: { First: { screens: { Home: Screen } } },
			screens: { Detail: Screen },
		};
		const adapted = withScreenTransitions(factory)(config).config;
		expect(Object.keys(adapted).slice(0, 2)).toEqual(["groups", "screens"]);
		expect(adapted.layout(layoutArgs).type).toBe(TestStackLayout);
		expect(adapted.screenLayout(layoutArgs).type).toBe(TestScreenLayout);
		const groupsOnly = withScreenTransitions(factory)({
			groups: config.groups,
		});
		expect(typeof groupsOnly.getComponent()).toBe("function");
	});

	it("renders static screens through React Navigation and handles auth route changes", async () => {
		let signedIn = true;
		function HostNavigator(props: any) {
			const { state, descriptors, NavigationContent } = useNavigationBuilder(
				StackRouter,
				props,
			);
			return (
				<NavigationContent>
					{state.routes.map((route) => descriptors[route.key].render())}
				</NavigationContent>
			);
		}
		const createHost = withScreenTransitions(
			createNavigatorFactory(HostNavigator),
		);
		const Stack = createHost({
			screens: {
				Home: { screen: () => createElement("home"), if: () => signedIn },
				SignIn: { screen: () => createElement("sign-in"), if: () => !signedIn },
			},
		});
		const Root = Stack.getComponent();
		let renderer!: ReactTestRenderer;
		const app = () => (
			<BaseNavigationContainer>
				<Root />
			</BaseNavigationContainer>
		);
		try {
			await act(async () => {
				renderer = create(app());
			});
			expect(renderer.root.findAllByType("home")).toHaveLength(1);
			expect(
				renderer.root.findAllByType("screen-transitions-stack-layout"),
			).toHaveLength(1);
			expect(
				renderer.root.findAllByType("screen-transitions-screen-layout"),
			).toHaveLength(1);
			signedIn = false;
			await act(async () => {
				renderer.update(app());
			});
			expect(renderer.root.findAllByType("home")).toHaveLength(0);
			expect(renderer.root.findAllByType("sign-in")).toHaveLength(1);
			expect(
				renderer.root.findAllByType("screen-transitions-screen-layout"),
			).toHaveLength(1);
		} finally {
			await act(async () => {
				renderer?.unmount();
			});
		}
	});

	it("explains how to wrap a static factory when passed an already configured navigator", () => {
		expect(() =>
			withScreenTransitions(factory({ screens: { Home: Screen } })),
		).toThrow("Pass the navigator factory itself");
	});
});
