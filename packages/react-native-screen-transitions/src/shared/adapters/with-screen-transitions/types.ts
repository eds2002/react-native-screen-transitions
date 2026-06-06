import type { ComponentType, ReactNode } from "react";

export type NavigatorLayoutArgs = {
	state: any;
	navigation: any;
	descriptors: Record<string, any>;
	children: ReactNode;
};

export type NavigatorLayout = (
	props: NavigatorLayoutArgs,
) => React.ReactElement;

export type ScreenLayoutArgs = {
	route: { key: string };
	navigation: any;
	options: any;
	theme: any;
	children: ReactNode;
};

export type ScreenLayout = (props: ScreenLayoutArgs) => React.ReactElement;

export type NavigatorWithScreenTransitions = {
	Navigator: ComponentType<any>;
	Screen: unknown;
	Group: unknown;
};
