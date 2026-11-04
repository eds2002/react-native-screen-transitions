import { createElement } from "react";
import type {
	NavigatorLayout,
	NavigatorLayoutArgs,
	ScreenLayout,
	ScreenLayoutArgs,
} from "../../adapters/with-screen-transitions/types";

export function TestStackLayout({
	layout,
	layoutArgs,
}: {
	layout?: NavigatorLayout;
	layoutArgs: NavigatorLayoutArgs;
}) {
	return createElement(
		"screen-transitions-stack-layout",
		null,
		layout ? layout(layoutArgs) : layoutArgs.children,
	);
}

export function TestScreenLayout({
	screenLayout,
	screenLayoutArgs,
}: {
	screenLayout?: ScreenLayout;
	screenLayoutArgs: ScreenLayoutArgs;
}) {
	return createElement(
		"screen-transitions-screen-layout",
		null,
		screenLayout ? screenLayout(screenLayoutArgs) : screenLayoutArgs.children,
	);
}
