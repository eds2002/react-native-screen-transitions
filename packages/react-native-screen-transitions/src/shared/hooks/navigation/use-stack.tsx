import type { Route } from "@react-navigation/native";
import { createContext, useContext } from "react";
import type { DerivedValue } from "react-native-reanimated";
import type { StackCoreContextValue } from "../../providers/stack/core.provider";
import type { OverlayMode, OverlayProps } from "../../types/overlay.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
} from "../../types/stack.types";

export interface StackDescriptor<
	TRoute extends BaseStackRoute = Route<string>,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> extends BaseStackDescriptor<TRoute, TNavigation> {
	options: BaseStackDescriptor["options"] & {
		overlay?: (props: OverlayProps) => React.ReactNode;
		overlayMode?: OverlayMode;
		overlayShown?: boolean;
		meta?: Record<string, unknown>;
		enableTransitions?: boolean;
	};
}

export type StackScene<TDescriptor extends StackDescriptor = StackDescriptor> =
	BaseStackScene<TDescriptor>;

export interface StackContextValue extends StackCoreContextValue {
	navigatorKey: string;
	routeKeys: string[];
	routes: Route<string>[];
	scenes: StackScene[];
	stackProgress: DerivedValue<number>;
	optimisticFocusedIndex: DerivedValue<number>;
}

export const StackContext = createContext<StackContextValue | null>(null);
StackContext.displayName = "Stack";

export function useStack<T extends StackContextValue = StackContextValue>(): T {
	const context = useContext(StackContext);

	if (context === null) {
		throw new Error("useStack must be used within a Stack provider");
	}

	return context as T;
}
