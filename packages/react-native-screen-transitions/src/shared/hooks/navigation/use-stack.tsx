import type { Route } from "@react-navigation/native";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useRef,
	useSyncExternalStore,
} from "react";
import type { DerivedValue } from "react-native-reanimated";
import type { StackCoreContextValue } from "../../providers/stack/core.provider";
import type { OverlayProps } from "../../types/overlay.types";
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
		overlayShown?: boolean;
		meta?: Record<string, unknown>;
		enableTransitions?: boolean;
	};
}

export type StackScene<TDescriptor extends StackDescriptor = StackDescriptor> =
	BaseStackScene<TDescriptor>;

type StackDismissRequest = (payload: { route: BaseStackRoute }) => boolean;
type StackSelector<T> = (stack: StackContextValue) => T;

export interface StackContextValue extends StackCoreContextValue {
	navigatorKey: string;
	routeKeys: string[];
	routes: Route<string>[];
	scenes: StackScene[];
	optimisticFocusedIndex: DerivedValue<number>;
	focusedIndex: number;
	requestDismiss?: StackDismissRequest;
}

interface StackStoreApi {
	getSnapshot: () => StackContextValue;
	subscribe: (listener: () => void) => () => void;
}

interface MutableStackStoreApi extends StackStoreApi {
	notify: () => void;
	setSnapshot: (snapshot: StackContextValue) => boolean;
}

const createStackStore = (
	initialSnapshot: StackContextValue,
): MutableStackStoreApi => {
	let snapshot = initialSnapshot;
	const listeners = new Set<() => void>();

	return {
		getSnapshot: () => snapshot,
		notify: () => {
			for (const listener of listeners) {
				listener();
			}
		},
		setSnapshot: (nextSnapshot) => {
			if (Object.is(snapshot, nextSnapshot)) {
				return false;
			}

			snapshot = nextSnapshot;
			return true;
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
};

const StackContext = createContext<StackStoreApi | null>(null);
StackContext.displayName = "Stack";

export function StackProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: StackContextValue;
}) {
	const storeRef = useRef<MutableStackStoreApi | null>(null);
	const pendingNotifyRef = useRef(false);

	let store = storeRef.current;
	if (!store) {
		store = createStackStore(value);
		storeRef.current = store;
	}

	pendingNotifyRef.current =
		store.setSnapshot(value) || pendingNotifyRef.current;

	useLayoutEffect(() => {
		if (!pendingNotifyRef.current) {
			return;
		}

		pendingNotifyRef.current = false;
		store.notify();
	});

	return (
		<StackContext.Provider value={store}>{children}</StackContext.Provider>
	);
}

function useStackStore(): StackStoreApi {
	const store = useContext(StackContext);

	if (store === null) {
		throw new Error("useStack must be used within a Stack provider");
	}

	return store;
}

export function useStack<T extends StackContextValue = StackContextValue>(): T;
export function useStack<T>(selector: StackSelector<T>): T;
export function useStack<T>(
	selector?: StackSelector<T>,
): StackContextValue | T {
	const store = useStackStore();
	const selectorRef = useRef<StackSelector<StackContextValue | T>>(
		selector ?? ((stack) => stack),
	);
	selectorRef.current = selector ?? ((stack) => stack);

	const getSelectedSnapshot = useCallback(
		() => selectorRef.current(store.getSnapshot()),
		[store],
	);

	return useSyncExternalStore(
		store.subscribe,
		getSelectedSnapshot,
		getSelectedSnapshot,
	);
}
