import { createContext, useContext, useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import { getAncestorKeys } from "./helpers/get-ancestor-keys";
import { getAncestorNavigatorKeys } from "./helpers/get-ancestor-navigator-keys";

/**
 * Base descriptor interface - minimal contract for all stack types.
 * This allows blank-stack and native-stack to work with the shared
 * providers without tight coupling to React Navigation.
 */
export type BaseDescriptor = BaseStackDescriptor;

interface KeysContextType<TDescriptor extends BaseDescriptor = BaseDescriptor> {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	ancestorKeys: string[];
	navigatorKey: string;
	ancestorNavigatorKeys: string[];
	branchNavigatorKey?: string;
}

interface ScreenKeysContextType {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	isFirstKey: boolean;
	isTopMostScreen: boolean;
	ancestorKeys: string[];
	navigatorKey: string;
	ancestorNavigatorKeys: string[];
	hasConfiguredInterpolator: boolean;
	isBranchScreen: boolean;
	branchNavigatorKey?: string;
}

const KeysContext = createContext<KeysContextType | undefined>(undefined);
const ScreenKeysContext = createContext<ScreenKeysContextType | undefined>(
	undefined,
);

interface KeysProviderProps<TDescriptor extends BaseDescriptor> {
	children: React.ReactNode;
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

export function KeysProvider<TDescriptor extends BaseDescriptor>({
	children,
	previous,
	current,
	next,
}: KeysProviderProps<TDescriptor>) {
	const ancestorKeys = getAncestorKeys(current);
	const ancestorKeysSignature = ancestorKeys.join("|");
	const ancestorNavigatorKeys = getAncestorNavigatorKeys(current);
	const ancestorNavigatorKeysSignature = ancestorNavigatorKeys.join("|");
	const previousScreenKey = previous?.route.key;
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;
	const navigationState = current.navigation.getState();
	const navigatorKey = navigationState?.key ?? "";
	const isFirstKey =
		navigationState.routes.findIndex(
			(route) => route.key === current.route.key,
		) === 0;
	const isTopMostScreen = !next;
	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;

	const { isBranchScreen, branchNavigatorKey } = useMemo(() => {
		const state = current.navigation.getState();
		const currentRoute = state?.routes?.find(
			(route) => route.key === current.route.key,
		);
		if (!currentRoute || !("state" in currentRoute)) {
			return { isBranchScreen: false, branchNavigatorKey: undefined };
		}
		const nestedState = (currentRoute as { state?: { key?: unknown } }).state;
		return {
			isBranchScreen: true,
			branchNavigatorKey:
				typeof nestedState?.key === "string" ? nestedState.key : undefined,
		};
	}, [current.navigation, current.route.key]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the signature instead>
	const value = useMemo<KeysContextType<TDescriptor>>(
		() => ({
			previous,
			current,
			next,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			branchNavigatorKey,
		}),
		[
			previous,
			current,
			next,
			ancestorKeysSignature,
			navigatorKey,
			ancestorNavigatorKeysSignature,
			branchNavigatorKey,
		],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the signature instead>
	const screenKeysValue = useMemo<ScreenKeysContextType>(
		() => ({
			previousScreenKey,
			currentScreenKey,
			nextScreenKey,
			isFirstKey,
			isTopMostScreen,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			hasConfiguredInterpolator,
			isBranchScreen,
			branchNavigatorKey,
		}),
		[
			previousScreenKey,
			currentScreenKey,
			nextScreenKey,
			isFirstKey,
			isTopMostScreen,
			ancestorKeysSignature,
			navigatorKey,
			ancestorNavigatorKeysSignature,
			hasConfiguredInterpolator,
			isBranchScreen,
			branchNavigatorKey,
		],
	);

	return (
		<KeysContext.Provider value={value}>
			<ScreenKeysContext.Provider value={screenKeysValue}>
				{children}
			</ScreenKeysContext.Provider>
		</KeysContext.Provider>
	);
}

export function useKeys<
	TDescriptor extends BaseDescriptor = BaseDescriptor,
>(): KeysContextType<TDescriptor> {
	const context = useContext(KeysContext);
	if (context === undefined) {
		throw new Error("useKeys must be used within a KeysProvider");
	}
	return context as KeysContextType<TDescriptor>;
}

export function useScreenKeys(): ScreenKeysContextType {
	const context = useContext(ScreenKeysContext);
	if (context === undefined) {
		throw new Error("useScreenKeys must be used within a KeysProvider");
	}
	return context;
}
