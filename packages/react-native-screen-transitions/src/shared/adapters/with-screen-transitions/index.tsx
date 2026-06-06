import type {
	NavigatorTypeBagBase,
	TypedNavigator,
} from "@react-navigation/native";
import type { ComponentType, ReactNode } from "react";
import {
	Children,
	cloneElement,
	forwardRef,
	isValidElement,
	useCallback,
	useMemo,
} from "react";
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
	ScreenLayoutArgs,
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

function adaptNavigatorChildren(children: ReactNode): ReactNode {
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
	navigator: NavigatorWithScreenTransitions,
): any {
	const BaseNavigator = navigator.Navigator as ComponentType<any>;

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

			const transitionScreenLayout = useCallback(
				(screenLayoutArgs: ScreenLayoutArgs) => (
					<ScreenTransitionsScreenLayout
						screenLayout={screenLayout}
						screenLayoutArgs={screenLayoutArgs}
					/>
				),
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
