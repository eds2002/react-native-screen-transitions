import { it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * The catalog through a custom navigator written the way the custom navigators guide shows:
 * React Navigation's useNavigationBuilder with the stack router, the kit's useTransitionNavigator,
 * and TransitionNavigator.Scenes inside the navigator's own wrapper. Blank Stack is built on the kit
 * too, so this checks that nothing it does privately is needed.
 */
const React = await import("react");
const { View } = await import("react-native");
const { createNavigatorFactory, StackRouter, useNavigationBuilder } = await import("@react-navigation/native");
const { TransitionNavigator, useTransitionNavigator } = await import("../../navigators/react-navigation");
const { setNavigatorFactory } = await import("./stack-harness");

function KitNavigator({ id, initialRouteName, children, screenOptions }: Record<string, never>) {
	const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, {
		id,
		initialRouteName,
		children,
		screenOptions,
	});
	const navigator = useTransitionNavigator({ state, navigation, descriptors } as never);
	return React.createElement(
		NavigationContent,
		null,
		React.createElement(
			TransitionNavigator,
			{ value: navigator },
			React.createElement(View, { style: { flex: 1 } }, React.createElement(TransitionNavigator.Scenes)),
		),
	);
}

setNavigatorFactory(createNavigatorFactory(KitNavigator) as never);
const { runCatalog } = await import("./catalog-runner");

it("runs the generated catalog through a custom navigator built on the kit: every violation is a known issue", async () => {
	await runCatalog(sim, { label: "custom-navigator" });
}, 600_000);
