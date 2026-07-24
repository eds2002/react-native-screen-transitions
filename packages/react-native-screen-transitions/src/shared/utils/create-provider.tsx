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

export default function createProvider<
	ProviderName extends string,
	Guarded extends boolean = true,
>(name: ProviderName, options?: { guarded?: Guarded }) {
	return <ProviderProps extends object, ContextValue>(
		factory: (
			props: ProviderProps,
			internals: ProviderFactoryInternals<ContextValue>,
		) => {
			value?: ContextValue;
			enabled?: boolean;
			children?: ReactNode;
		},
	) => {
		const { guarded = true } = options ?? {};
		const providerDisplayName = `${name}Provider`;

		const StoreContext = createContext<ProviderStoreApi<ContextValue> | null>(
			null,
		);
		StoreContext.displayName = `${name}Store`;

		const createStoreHook = (strict: boolean) => {
			return <Selected,>(
				selector?: (value: ContextValue | null) => Selected,
			): Selected | ContextValue | null => {
				const store = useContext(StoreContext);
				const resolvedStore =
					store ?? (NullProviderStore as ProviderStoreApi<ContextValue>);
				const selectorRef = useRef<typeof selector>(selector);
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

					return selectorRef.current ? selectorRef.current(snapshot) : snapshot;
				}, [resolvedStore, store]);

				return useSyncExternalStore(
					resolvedStore.subscribe,
					getSelectedSnapshot,
					getSelectedSnapshot,
				);
			};
		};

		const useStoreSelector = createStoreHook(guarded);
		const factoryInternals: ProviderFactoryInternals<ContextValue> = {
			useParentStore: createStoreHook(false) as ProviderStoreHook<
				ContextValue,
				false
			>,
		};

		const Provider: React.FC<ProviderProps> = (props) => {
			const {
				children = (props as { children?: ReactNode }).children,
				enabled = true,
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
			[P in ProviderName as `use${P}Store`]: ProviderStoreHook<
				ContextValue,
				Guarded
			>;
		};
	};
}
