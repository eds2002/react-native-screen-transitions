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
 * provider store from outside its React context. Arrays of keys return ordered
 * snapshots (null for unmounted keys) and apply the selector to each store.
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
	(keys: readonly string[]): readonly (ContextValue | null)[];
	<Selected>(
		keys: readonly string[],
		selector: (value: ContextValue) => Selected,
	): readonly (Selected | null)[];
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
	(keys: readonly string[]): readonly (ContextValue | null)[];
	<Selected>(
		keys: readonly string[],
		selector: (value: ContextValue) => Selected,
	): readonly (Selected | null)[];
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
				| readonly string[]
				| null
				| ((value: ContextValue | null) => Selected),
			globalSelector?: (value: ContextValue) => Selected,
		):
			| Selected
			| ContextValue
			| null
			| readonly (Selected | ContextValue | null)[] => {
			const keys =
				global && Array.isArray(selectorOrKey)
					? (selectorOrKey as readonly string[])
					: null;
			const isGlobalLookup =
				global &&
				(keys !== null ||
					typeof selectorOrKey === "string" ||
					selectorOrKey === null);
			const key =
				isGlobalLookup && typeof selectorOrKey === "string"
					? selectorOrKey
					: null;
			const selector = (isGlobalLookup ? globalSelector : selectorOrKey) as
				| ((value: ContextValue | null) => Selected)
				| undefined;
			const contextStore = useContext(StoreContext);
			const selectionCache = useRef<
				readonly (Selected | ContextValue | null)[]
			>([]);
			const selectorRef = useRef(selector);
			selectorRef.current = selector;
			const getStore = useCallback(
				(lookupKey: string | null = key) => {
					if (isGlobalLookup) {
						return lookupKey !== null && globalRegistry
							? globalRegistry.getStore(lookupKey)
							: null;
					}

					return contextStore;
				},
				[contextStore, isGlobalLookup, key],
			);
			const subscribe = useCallback(
				(listener: () => void) => {
					const cleanups = (keys ?? [key]).map((lookupKey) => {
						let unsubscribeStore = (
							getStore(lookupKey) ?? NullProviderStore
						).subscribe(listener);
						const unsubscribeRegistry =
							isGlobalLookup && lookupKey !== null && globalRegistry
								? globalRegistry.subscribe(lookupKey, () => {
										unsubscribeStore();
										unsubscribeStore = (
											getStore(lookupKey) ?? NullProviderStore
										).subscribe(listener);
										listener();
									})
								: undefined;
						return () => {
							unsubscribeRegistry?.();
							unsubscribeStore();
						};
					});
					return () => {
						for (const cleanup of cleanups) cleanup();
					};
				},
				[getStore, isGlobalLookup, key, keys],
			);

			const getSelectedSnapshot = useCallback(() => {
				if (keys) {
					const selected = keys.map((lookupKey) => {
						const snapshot = getStore(lookupKey)?.getSnapshot() ?? null;
						return snapshot !== null && selectorRef.current
							? selectorRef.current(snapshot)
							: snapshot;
					});
					if (
						selected.length !== selectionCache.current.length ||
						selected.some(
							(value, index) =>
								!Object.is(value, selectionCache.current[index]),
						)
					) {
						selectionCache.current = selected;
					}
					return selectionCache.current;
				}
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
			}, [getStore, isGlobalLookup, key, keys, required]);

			return useSyncExternalStore(
				subscribe,
				getSelectedSnapshot,
				getSelectedSnapshot,
			);
		};
		const useOptionalStoreSelector = <Selected,>(
			selectorOrKey?:
				| string
				| readonly string[]
				| null
				| ((value: ContextValue | null) => Selected),
			globalSelector?: (value: ContextValue) => Selected,
		) => useStoreSelection(false, selectorOrKey, globalSelector);
		const useStoreSelector = <Selected,>(
			selectorOrKey?:
				| string
				| readonly string[]
				| ((value: ContextValue) => Selected),
			globalSelector?: (value: ContextValue) => Selected,
		) =>
			useStoreSelection(
				true,
				selectorOrKey as
					| string
					| readonly string[]
					| ((value: ContextValue | null) => Selected)
					| undefined,
				globalSelector,
			);
		const StoreProvider = ({
			children,
			registerGlobally = true,
			storeKey,
			value,
		}: {
			children?: ReactNode;
			registerGlobally?: boolean;
			storeKey?: string;
			value: ContextValue;
		}) => {
			const storeRef = useRef<MutableProviderStoreApi<ContextValue> | null>(
				null,
			);
			const pendingNotifyRef = useRef(false);

			if (storeRef.current === null) {
				storeRef.current = createProviderStore<ContextValue>(value);
			}
			const store = storeRef.current;

			useLayoutEffect(() => {
				if (!globalRegistry || !registerGlobally) {
					return;
				}

				if (typeof storeKey !== "string") {
					throw new Error(
						`${name}StoreProvider requires a storeKey when global mode is enabled`,
					);
				}

				return globalRegistry.register(storeKey, store);
			}, [registerGlobally, storeKey, store]);

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
		StoreProvider.displayName = `${name}StoreProvider`;

		const OwnedProvider: React.FC<ProviderProps> = (props) => {
			const {
				children = (props as { children?: ReactNode }).children,
				key,
				value,
			} = factory(props);
			return (
				<StoreProvider storeKey={key} value={value}>
					{children}
				</StoreProvider>
			);
		};
		type ReuseProps = { screenKey: string; children?: ReactNode };
		const ReusedProvider = ({ screenKey, children }: ReuseProps) => {
			const retainedStore = useRef<ProviderStoreApi<ContextValue> | null>(null);
			const subscribe = useCallback(
				(listener: () => void) =>
					globalRegistry?.subscribe(screenKey, listener) ??
					NullProviderStore.subscribe(listener),
				[screenKey],
			);
			const getSnapshot = useCallback(
				() => globalRegistry?.getStore(screenKey) ?? null,
				[screenKey],
			);
			const registeredStore = useSyncExternalStore(
				subscribe,
				getSnapshot,
				getSnapshot,
			);
			// Keep the same context alive while a departing screen's overlay finishes.
			if (registeredStore) retainedStore.current = registeredStore;
			const store = registeredStore ?? retainedStore.current;
			return store ? (
				<StoreContext.Provider value={store}>{children}</StoreContext.Provider>
			) : null;
		};
		type Props = ProviderProps | (Global extends true ? ReuseProps : never);
		const Provider: React.FC<Props> = (props) => {
			if (
				global &&
				"screenKey" in props &&
				typeof props.screenKey === "string"
			) {
				return (
					<ReusedProvider key={props.screenKey} screenKey={props.screenKey}>
						{(props as ReuseProps).children}
					</ReusedProvider>
				);
			}
			return <OwnedProvider {...(props as ProviderProps)} />;
		};
		Provider.displayName = providerDisplayName;

		const getStore = (key: string): ContextValue => {
			const value = globalRegistry?.getStore(key)?.getSnapshot();
			if (value === null || value === undefined)
				throw new Error(`${name}Store is unavailable for key "${key}"`);
			return value;
		};

		return {
			StoreProvider,
			...(global ? { [`get${name}Store`]: getStore } : {}),
			[`${name}Provider`]: Provider,
			[`useOptional${name}Store`]: useOptionalStoreSelector,
			[`use${name}Store`]: useStoreSelector,
		} as (Global extends true
			? {
					[P in ProviderName as `get${P}Store`]: (key: string) => ContextValue;
				}
			: unknown) & { StoreProvider: typeof StoreProvider } & {
			[P in ProviderName as `${P}Provider`]: React.FC<Props>;
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
