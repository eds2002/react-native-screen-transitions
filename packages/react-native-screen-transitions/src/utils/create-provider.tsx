/**
 * THANK YOU @MatiPl01
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/providers/utils/createProvider.tsx
 * SUPER COOL AMAZING UTILITY
 *
 * Store-only provider: values propagate exclusively through subscription
 * selectors. `use${Name}Store` requires an available store, while
 * `useOptional${Name}Store` preserves nullable bootstrap and outer-context
 * access. There is intentionally no raw context channel, so consumers
 * subscribe only to the values they render.
 *
 * Factories do not memoize what they return:
 * - `value`: the store shallow-compares snapshots and keeps the previous
 *   object when the contents are unchanged. Derived object and array fields
 *   must still have stable identities.
 * - `children`: passed-through children keep their identity across
 *   provider-local renders. Factories that wrap children should use a
 *   module-level memoized component for the wrapper.
 *
 * Providers created with `global: true` return a `key` from their factory.
 * Both generated store hooks accept that key to subscribe to the original
 * provider store from outside its React context.
 */
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useRef,
	useSyncExternalStore,
} from "react";

type ProviderStoreHook<ContextValue> = {
	(): ContextValue;
	<Selected>(selector: (value: ContextValue) => Selected): Selected;
};

type GlobalProviderStoreHook<ContextValue> = {
	(key: string): ContextValue;
	<Selected>(
		key: string,
		selector: (value: ContextValue) => Selected,
	): Selected;
};

type OptionalProviderStoreHook<ContextValue> = {
	(): ContextValue | null;
	<Selected>(selector: (value: ContextValue | null) => Selected): Selected;
};

type OptionalGlobalProviderStoreHook<ContextValue> = {
	(key: string | null): ContextValue | null;
	<Selected>(
		key: string | null,
		selector: (value: ContextValue) => Selected,
	): Selected | null;
};

type ResolvedProviderStoreHook<
	ContextValue,
	Global extends boolean,
> = ProviderStoreHook<ContextValue> &
	(Global extends true ? GlobalProviderStoreHook<ContextValue> : unknown);

type ResolvedOptionalProviderStoreHook<
	ContextValue,
	Global extends boolean,
> = OptionalProviderStoreHook<ContextValue> &
	(Global extends true
		? OptionalGlobalProviderStoreHook<ContextValue>
		: unknown);

type ProviderFactoryResult<ContextValue, Global extends boolean> = {
	value: ContextValue;
	children?: ReactNode;
} & (Global extends true ? { key: string } : { key?: never });

interface ProviderStoreApi<ContextValue> {
	getSnapshot: () => ContextValue | null;
	subscribe: (listener: () => void) => () => void;
}

interface MutableProviderStoreApi<ContextValue>
	extends ProviderStoreApi<ContextValue> {
	notify: () => void;
	setSnapshot: (snapshot: ContextValue | null) => boolean;
}

interface ProviderStoreRegistry<ContextValue> {
	getStore: (key: string) => ProviderStoreApi<ContextValue> | null;
	register: (key: string, store: ProviderStoreApi<ContextValue>) => () => void;
	subscribe: (key: string, listener: () => void) => () => void;
}

const NullProviderStore: ProviderStoreApi<never> = {
	getSnapshot: () => null,
	subscribe: () => () => {},
};

const shallowEqual = (a: unknown, b: unknown): boolean => {
	if (Object.is(a, b)) {
		return true;
	}

	if (
		typeof a !== "object" ||
		a === null ||
		typeof b !== "object" ||
		b === null
	) {
		return false;
	}

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) {
		return false;
	}

	for (const key of aKeys) {
		if (
			!(key in b) ||
			!Object.is(
				(a as Record<string, unknown>)[key],
				(b as Record<string, unknown>)[key],
			)
		) {
			return false;
		}
	}

	return true;
};

const createProviderStore = <ContextValue,>(
	initialSnapshot: ContextValue | null,
): MutableProviderStoreApi<ContextValue> => {
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
			if (shallowEqual(snapshot, nextSnapshot)) {
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

const createProviderStoreRegistry = <
	ContextValue,
>(): ProviderStoreRegistry<ContextValue> => {
	const listenersByKey = new Map<string, Set<() => void>>();
	const storesByKey = new Map<string, ProviderStoreApi<ContextValue>>();

	const notify = (key: string) => {
		for (const listener of listenersByKey.get(key) ?? []) {
			listener();
		}
	};

	return {
		getStore: (key) => storesByKey.get(key) ?? null,
		register: (key, store) => {
			storesByKey.set(key, store);
			notify(key);

			return () => {
				storesByKey.delete(key);
				notify(key);
			};
		},
		subscribe: (key, listener) => {
			const listeners = listenersByKey.get(key) ?? new Set<() => void>();
			listeners.add(listener);
			listenersByKey.set(key, listeners);

			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) {
					listenersByKey.delete(key);
				}
			};
		},
	};
};

export default function createProvider<
	ProviderName extends string,
	Global extends boolean = false,
>(name: ProviderName, options?: { global?: Global }) {
	return <ProviderProps extends object, ContextValue>(
		factory: (
			props: ProviderProps,
		) => ProviderFactoryResult<ContextValue, Global>,
	) => {
		const { global = false } = options ?? {};
		const providerDisplayName = `${name}Provider`;
		const globalRegistry = global
			? createProviderStoreRegistry<ContextValue>()
			: null;

		const StoreContext = createContext<ProviderStoreApi<ContextValue> | null>(
			null,
		);
		StoreContext.displayName = `${name}Store`;

		const useStoreSelection = <Selected,>(
			required: boolean,
			selectorOrKey?:
				| string
				| null
				| ((value: ContextValue | null) => Selected),
			globalSelector?: (value: ContextValue) => Selected,
		): Selected | ContextValue | null => {
			const isGlobalLookup =
				global && (typeof selectorOrKey === "string" || selectorOrKey === null);
			const key = isGlobalLookup ? selectorOrKey : null;
			const selector = (isGlobalLookup ? globalSelector : selectorOrKey) as
				| ((value: ContextValue | null) => Selected)
				| undefined;
			const contextStore = useContext(StoreContext);
			const selectorRef = useRef(selector);
			selectorRef.current = selector;
			const getStore = useCallback(() => {
				if (isGlobalLookup) {
					return key !== null && globalRegistry
						? globalRegistry.getStore(key)
						: null;
				}

				return contextStore;
			}, [contextStore, isGlobalLookup, key]);
			const subscribe = useCallback(
				(listener: () => void) => {
					let unsubscribeStore = (
						getStore() ?? (NullProviderStore as ProviderStoreApi<ContextValue>)
					).subscribe(listener);
					const unsubscribeRegistry =
						isGlobalLookup && key !== null && globalRegistry
							? globalRegistry.subscribe(key, () => {
									unsubscribeStore();
									unsubscribeStore = (
										getStore() ??
										(NullProviderStore as ProviderStoreApi<ContextValue>)
									).subscribe(listener);
									listener();
								})
							: () => {};

					return () => {
						unsubscribeRegistry();
						unsubscribeStore();
					};
				},
				[getStore, isGlobalLookup, key],
			);

			const getSelectedSnapshot = useCallback(() => {
				const snapshot = getStore()?.getSnapshot() ?? null;

				if (required && snapshot === null) {
					throw new Error(
						key === null
							? `${name}Store is unavailable`
							: `${name}Store is unavailable for key "${key}"`,
					);
				}

				if (isGlobalLookup && snapshot === null) {
					return null;
				}

				return typeof selectorRef.current === "function"
					? selectorRef.current(snapshot)
					: snapshot;
			}, [getStore, isGlobalLookup, key, required]);

			return useSyncExternalStore(
				subscribe,
				getSelectedSnapshot,
				getSelectedSnapshot,
			);
		};
		const useOptionalStoreSelector = <Selected,>(
			selectorOrKey?:
				| string
				| null
				| ((value: ContextValue | null) => Selected),
			globalSelector?: (value: ContextValue) => Selected,
		) => useStoreSelection(false, selectorOrKey, globalSelector);
		const useStoreSelector = <Selected,>(
			selectorOrKey?: string | ((value: ContextValue) => Selected),
			globalSelector?: (value: ContextValue) => Selected,
		) =>
			useStoreSelection(
				true,
				selectorOrKey as
					| string
					| ((value: ContextValue | null) => Selected)
					| undefined,
				globalSelector,
			);
		const Provider: React.FC<ProviderProps> = (props) => {
			const {
				children = (props as { children?: ReactNode }).children,
				key,
				value,
			} = factory(props);
			const storeRef = useRef<MutableProviderStoreApi<ContextValue> | null>(
				null,
			);
			const pendingNotifyRef = useRef(false);

			if (storeRef.current === null) {
				storeRef.current = createProviderStore<ContextValue>(value);
			}
			const store = storeRef.current;

			useLayoutEffect(() => {
				if (!globalRegistry) {
					return;
				}

				if (typeof key !== "string") {
					throw new Error(
						`${name}Provider must return a key when global mode is enabled`,
					);
				}

				return globalRegistry.register(key, store);
			}, [key, store]);

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
				<StoreContext.Provider value={store}>{children}</StoreContext.Provider>
			);
		};
		Provider.displayName = providerDisplayName;

		return {
			[`${name}Provider`]: Provider,
			[`useOptional${name}Store`]: useOptionalStoreSelector,
			[`use${name}Store`]: useStoreSelector,
		} as {
			[P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
		} & {
			[P in ProviderName as `useOptional${P}Store`]: ResolvedOptionalProviderStoreHook<
				ContextValue,
				Global
			>;
		} & {
			[P in ProviderName as `use${P}Store`]: ResolvedProviderStoreHook<
				ContextValue,
				Global
			>;
		};
	};
}
