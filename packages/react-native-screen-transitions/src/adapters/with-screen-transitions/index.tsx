import type {
	NavigatorTypeBagBase,
	TypedNavigator,
} from "@react-navigation/native";
import type { ReactNode } from "react";
import {
	Children,
	cloneElement,
	forwardRef,
	isValidElement,
	useCallback,
	useMemo,
} from "react";
import type { ScreenTransitionsFactory } from "./factory-types";
import type {
	NativeStackAdapterOptionInput,
	NativeStackAdapterOptions,
} from "./options";
import { adaptNativeStackTransitionOptions } from "./options";
import {
	ScreenTransitionsScreenLayout,
	ScreenTransitionsStackLayout,
} from "./stack-layout";
import type {
	NavigatorLayout,
	NavigatorLayoutArgs,
	NavigatorWithScreenTransitions,
	ScreenLayout,
} from "./types";

export type { NativeStackAdapterOptions } from "./options";

type ScreenTransitionsNavigatorProps = {
	layout?: NavigatorLayout;
	screenLayout?: ScreenLayout;
	[key: string]: any;
};

type ScreenTransitionsNavigatorTypeBag<TBag extends NavigatorTypeBagBase> =
	Omit<TBag, "ScreenOptions"> & {
		ScreenOptions: NativeStackAdapterOptions<TBag["ScreenOptions"]>;
	};

export function createTransitionScreenLayout(
	screenLayout?: ScreenLayout,
): ScreenLayout {
	return (screenLayoutArgs) => (
		<ScreenTransitionsScreenLayout
			screenLayout={screenLayout}
			screenLayoutArgs={screenLayoutArgs}
		/>
	);
}

export function adaptNavigatorChildren(children: ReactNode): ReactNode {
	return Children.map(children, (child) => {
		if (!isValidElement(child)) {
			return child;
		}

		const props = child.props as Record<string, unknown>;
		const nextProps: Record<string, unknown> = {};
		let changed = false;

		if ("options" in props) {
			nextProps.options = adaptNativeStackTransitionOptions(
				props.options as NativeStackAdapterOptionInput | undefined,
			);
			changed = true;
		}

		if ("screenOptions" in props) {
			nextProps.screenOptions = adaptNativeStackTransitionOptions(
				props.screenOptions as NativeStackAdapterOptionInput | undefined,
			);
			changed = true;
		}

		// Screen and group layouts replace the navigator default, so each override
		// must carry the transition screen layout with it.
		if (typeof props.layout === "function") {
			nextProps.layout = createTransitionScreenLayout(
				props.layout as ScreenLayout,
			);
			changed = true;
		}

		if (typeof props.screenLayout === "function") {
			nextProps.screenLayout = createTransitionScreenLayout(
				props.screenLayout as ScreenLayout,
			);
			changed = true;
		}

		if (props.children !== undefined && typeof props.children !== "function") {
			nextProps.children = adaptNavigatorChildren(props.children as ReactNode);
			changed = true;
		}

		if (!changed) {
			return child;
		}

		return cloneElement(child, nextProps);
	});
}

function adaptStaticConfig(config: Record<string, any>): Record<string, any> {
	const adaptScreens = (screens: Record<string, any>) =>
		Object.fromEntries(
			Object.entries(screens).map(([name, screen]) => [
				name,
				screen && typeof screen === "object" && "screen" in screen
					? {
							...screen,
							options: adaptNativeStackTransitionOptions(screen.options),
							...(typeof screen.layout === "function"
								? { layout: createTransitionScreenLayout(screen.layout) }
								: {}),
						}
					: screen,
			]),
		);

	// Preserve screens/groups insertion order: it determines the initial route.
	const adapted = { ...config };
	if (config.screens) adapted.screens = adaptScreens(config.screens);
	if (config.groups) {
		adapted.groups = Object.fromEntries(
			Object.entries(config.groups).map(([name, value]) => {
				const group = value as Record<string, any>;
				return [
					name,
					{
						...group,
						screens: adaptScreens(group.screens),
						screenOptions: adaptNativeStackTransitionOptions(
							group.screenOptions,
						),
						...(typeof group.screenLayout === "function"
							? {
									screenLayout: createTransitionScreenLayout(
										group.screenLayout,
									),
								}
							: {}),
					},
				];
			}),
		);
	}
	adapted.screenOptions = adaptNativeStackTransitionOptions(
		config.screenOptions,
	);
	adapted.layout = (layoutArgs: NavigatorLayoutArgs) => (
		<ScreenTransitionsStackLayout
			layout={config.layout}
			layoutArgs={layoutArgs}
		/>
	);
	adapted.screenLayout = createTransitionScreenLayout(config.screenLayout);
	return adapted;
}

export function withScreenTransitions<TBag extends NavigatorTypeBagBase>(
	factory: () => TypedNavigator<TBag, unknown>,
): ScreenTransitionsFactory<TBag>;
export function withScreenTransitions<
	TBag extends NavigatorTypeBagBase,
	TConfig,
>(
	navigator: TypedNavigator<TBag, TConfig>,
): TypedNavigator<ScreenTransitionsNavigatorTypeBag<TBag>, TConfig>;
export function withScreenTransitions<
	TNavigator extends NavigatorWithScreenTransitions,
>(navigator: TNavigator): TNavigator;
export function withScreenTransitions(
	navigator: NavigatorWithScreenTransitions | ((config?: any) => any),
): any {
	if (typeof navigator === "function" && !("Navigator" in navigator)) {
		return (config?: Record<string, any>) =>
			config == null
				? withScreenTransitions(navigator())
				: navigator(adaptStaticConfig(config));
	}
	const BaseNavigator = (navigator as NavigatorWithScreenTransitions)
		?.Navigator;
	if (!BaseNavigator) {
		throw new Error(
			"withScreenTransitions requires a navigator with a Navigator component. Pass the navigator factory itself for static configuration: withScreenTransitions(createNativeStackNavigator)({ screens: ... }).",
		);
	}

	const Navigator = forwardRef<unknown, ScreenTransitionsNavigatorProps>(
		function ScreenTransitionsNavigator(
			{ layout, screenLayout, ...props },
			ref,
		) {
			const transitionLayout = useCallback(
				(layoutArgs: NavigatorLayoutArgs) => (
					<ScreenTransitionsStackLayout
						layout={layout}
						layoutArgs={layoutArgs}
					/>
				),
				[layout],
			);

			const transitionScreenLayout = useMemo(
				() => createTransitionScreenLayout(screenLayout),
				[screenLayout],
			);
			const screenOptions = useMemo(
				() => adaptNativeStackTransitionOptions(props.screenOptions),
				[props.screenOptions],
			);
			const children = useMemo(
				() => adaptNavigatorChildren(props.children),
				[props.children],
			);

			return (
				<BaseNavigator
					{...props}
					screenOptions={screenOptions}
					ref={ref as never}
					layout={transitionLayout}
					screenLayout={transitionScreenLayout}
				>
					{children}
				</BaseNavigator>
			);
		},
	);

	Navigator.displayName = `withScreenTransitions(${
		BaseNavigator.displayName ?? BaseNavigator.name ?? "Navigator"
	})`;

	return {
		...navigator,
		Navigator,
	};
}
