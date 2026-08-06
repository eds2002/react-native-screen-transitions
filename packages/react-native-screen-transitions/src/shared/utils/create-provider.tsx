/**
 * THANK YOU @MatiPl01
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/providers/utils/createProvider.tsx
 * SUPER COOL AMAZING UTILITY
 *
 * Store-only provider: values propagate exclusively through a subscription
 * store read with `use${Name}Store(selector)`. There is intentionally no raw
 * context channel, so consumers subscribe only to the values they render.
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
 * Their generated store hook accepts that key to subscribe to the original
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

type ProviderSnapshot<
	ContextValue,
	Guarded extends boolean,
> = Guarded extends true ? ContextValue : ContextValue | null;

type ProviderSelector<ContextValue, Guarded extends boolean, Selected> = (
	value: ProviderSnapshot<ContextValue, Guarded>,
) => Selected;

type ProviderStoreHook<ContextValue, Guarded extends boolean> = {
	(): ProviderSnapshot<ContextValue, Guarded>;
	<Selected>(
		selector: ProviderSelector<ContextValue, Guarded, Selected>,
	): Selected;
};

type GlobalProviderStoreHook<ContextValue> = {
	(key: string): ContextValue | null;
	<Selected>(
		key: string,
		selector: (value: ContextValue) => Selected,
	): Selected | null;
};

type ResolvedProviderStoreHook<
	ContextValue,
	Guarded extends boolean,
	Global extends boolean,
> = ProviderStoreHook<ContextValue, Guarded> &
	(Global extends true ? GlobalProviderStoreHook<ContextValue> : unknown);

type ProviderFactoryResult<ContextValue, Global extends boolean> = {
	value?: ContextValue;
	enabled?: boolean;
	children?: ReactNode;
} & (Global extends true ? { key: string } : { key?: never });

export type ProviderFactoryInternals<ContextValue> = {
	useParentStore: ProviderStoreHook<ContextValue, false>;
};

export interface ProviderStoreApi<ContextValue> {
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
	type Registration = {
		store: ProviderStoreApi<ContextValue>;
	};

	const listenersByKey = new Map<string, Set<() => void>>();
	const registrationsByKey = new Map<string, Registration[]>();

	const getStore = (key: string) => {
		const registrations = registrationsByKey.get(key);
		return registrations?.[registrations.length - 1]?.store ?? null;
	};

	const notify = (key: string) => {
		for (const listener of listenersByKey.get(key) ?? []) {
			listener();
		}
	};

	return {
		getStore,
		register: (key, store) => {
			const registration: Registration = { store };
			const registrations = registrationsByKey.get(key) ?? [];
			registrationsByKey.set(key, [...registrations, registration]);
			notify(key);

			return () => {
				const currentRegistrations = registrationsByKey.get(key);
				if (!currentRegistrations?.includes(registration)) {
					return;
				}

				const previousStore = getStore(key);
				const nextRegistrations = currentRegistrations.filter(
					(currentRegistration) => currentRegistration !== registration,
				);

				if (nextRegistrations.length === 0) {
					registrationsByKey.delete(key);
				} else {
					registrationsByKey.set(key, nextRegistrations);
				}

				if (getStore(key) !== previousStore) {
					notify(key);
				}
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
	Guarded extends boolean = true,
	Global extends boolean = false,
>(name: ProviderName, options?: { guarded?: Guarded; global?: Global }) {
	return <ProviderProps extends object, ContextValue>(
		factory: (
			props: ProviderProps,
			internals: ProviderFactoryInternals<ContextValue>,
		) => ProviderFactoryResult<ContextValue, Global>,
	) => {
		const { guarded = true, global = false } = options ?? {};
		const providerDisplayName = `${name}Provider`;
		const globalRegistry = global
			? createProviderStoreRegistry<ContextValue>()
			: null;
		const keyByStore = global
			? new WeakMap<ProviderStoreApi<ContextValue>, string>()
			: null;

		const StoreContext = createContext<ProviderStoreApi<ContextValue> | null>(
			null,
		);
		StoreContext.displayName = `${name}Store`;

		const useRegisteredStore = (
			key: string | null,
			fallbackStore: ProviderStoreApi<ContextValue> | null = null,
		) => {
			const subscribe = useCallback(
				(listener: () => void) => {
					if (key === null || !globalRegistry) {
						return () => {};
					}

					return globalRegistry.subscribe(key, listener);
				},
				[key],
			);
			const getSnapshot = useCallback(
				() =>
					key !== null && globalRegistry
						? (globalRegistry.getStore(key) ?? fallbackStore)
						: null,
				[key, fallbackStore],
			);

			return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
		};

		const createStoreHook = (strict: boolean, allowGlobalLookup: boolean) => {
			if (!allowGlobalLookup || !globalRegistry) {
				return <Selected,>(
					selector?: (value: ContextValue | null) => Selected,
				): Selected | ContextValue | null => {
					const store = useContext(StoreContext);
					const resolvedStore =
						store ?? (NullProviderStore as ProviderStoreApi<ContextValue>);
					const selectorRef = useRef(selector);
					selectorRef.current = selector;

					const getSelectedSnapshot = useCallback(() => {
						if (strict && store === null) {
							throw new Error(
								`${name} store must be used within a ${name}Provider`,
							);
						}

						const snapshot = resolvedStore.getSnapshot();

						if (strict && snapshot === null) {
							throw new Error(
								`${name} store must be used within an enabled ${name}Provider`,
							);
						}

						return selectorRef.current
							? selectorRef.current(snapshot)
							: snapshot;
					}, [resolvedStore, store]);

					return useSyncExternalStore(
						resolvedStore.subscribe,
						getSelectedSnapshot,
						getSelectedSnapshot,
					);
				};
			}

			return <Selected,>(
				selectorOrKey?: string | ((value: ContextValue | null) => Selected),
				globalSelector?: (value: ContextValue) => Selected,
			): Selected | ContextValue | null => {
				const isGlobalLookup = typeof selectorOrKey === "string";
				const key = isGlobalLookup ? selectorOrKey : null;
				const selector = (isGlobalLookup ? globalSelector : selectorOrKey) as
					| ((value: ContextValue | null) => Selected)
					| undefined;
				const contextStore = useContext(StoreContext);
				const matchingContextStore =
					key !== null &&
					contextStore !== null &&
					keyByStore?.get(contextStore) === key
						? contextStore
						: null;
				const registeredStore = useRegisteredStore(key, matchingContextStore);
				const store = isGlobalLookup ? registeredStore : contextStore;
				const resolvedStore =
					store ?? (NullProviderStore as ProviderStoreApi<ContextValue>);
				const selectorRef = useRef(selector);
				selectorRef.current = selector;

				const getSelectedSnapshot = useCallback(() => {
					if (!isGlobalLookup && strict && store === null) {
						throw new Error(
							`${name} store must be used within a ${name}Provider`,
						);
					}

					const snapshot = resolvedStore.getSnapshot();

					if (isGlobalLookup && snapshot === null) {
						return null;
					}

					if (!isGlobalLookup && strict && snapshot === null) {
						throw new Error(
							`${name} store must be used within an enabled ${name}Provider`,
						);
					}

					return typeof selectorRef.current === "function"
						? selectorRef.current(snapshot)
						: snapshot;
				}, [isGlobalLookup, resolvedStore, store]);

				return useSyncExternalStore(
					resolvedStore.subscribe,
					getSelectedSnapshot,
					getSelectedSnapshot,
				);
			};
		};

		const useStoreSelector = createStoreHook(guarded, global);
		const factoryInternals: ProviderFactoryInternals<ContextValue> = {
			useParentStore: createStoreHook(false, false) as ProviderStoreHook<
				ContextValue,
				false
			>,
		};

		const Provider: React.FC<ProviderProps> = (props) => {
			const {
				children = (props as { children?: ReactNode }).children,
				enabled = true,
				key,
				value,
			} = factory(props, factoryInternals);

			if (!value) {
				throw new Error(
					`${name}Context value must be provided. You likely forgot to return it from the factory function.`,
				);
			}

			const snapshotValue = enabled ? value : null;
			const storeRef = useRef<MutableProviderStoreApi<ContextValue> | null>(
				null,
			);
			const pendingNotifyRef = useRef(false);

			if (storeRef.current === null) {
				storeRef.current = createProviderStore<ContextValue>(snapshotValue);
			}
			const store = storeRef.current;
			if (keyByStore && typeof key === "string") {
				keyByStore.set(store, key);
			}

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
				store.setSnapshot(snapshotValue) || pendingNotifyRef.current;

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
			[`use${name}Store`]: useStoreSelector,
		} as {
			[P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
		} & {
			[P in ProviderName as `use${P}Store`]: ResolvedProviderStoreHook<
				ContextValue,
				Guarded,
				Global
			>;
		};
	};
}
