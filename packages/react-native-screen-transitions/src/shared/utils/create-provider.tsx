/**
 * THANK YOU @MatiPl01
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/providers/utils/createProvider.tsx
 * SUPER COOL AMAZING UTILITY
 */
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";

type InnerProviderComponent = React.FC<{ children: ReactNode }>;

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

type ProviderOptionalStoreHook<ContextValue> = {
	(): ContextValue | null;
	<Selected>(selector: (value: ContextValue | null) => Selected): Selected;
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

export default function createProvider<
	ProviderName extends string,
	Guarded extends boolean = true,
>(name: ProviderName, options?: { guarded?: Guarded }) {
	return <ProviderProps extends object, ContextValue>(
		factory: (props: ProviderProps) => {
			value?: ContextValue;
			enabled?: boolean;
			children?:
				| ReactNode
				| ((
						innerProvider: {
							[K in ProviderName as `${K}Provider`]: InnerProviderComponent;
						},
				  ) => ReactNode);
		},
	) => {
		const { guarded = true } = options ?? {};
		const providerDisplayName = `${name}Provider`;
		const innerProviderDisplayName = `${name}InnerProvider`;

		const Context = createContext<ContextValue | null>(null);
		Context.displayName = name;

		const StoreContext = createContext<ProviderStoreApi<ContextValue> | null>(
			null,
		);
		StoreContext.displayName = `${name}Store`;

		const Provider: React.FC<ProviderProps> = (props) => {
			const {
				children = (props as { children?: ReactNode }).children,
				enabled = true,
				value,
			} = factory(props);

			if (!value) {
				throw new Error(
					`${name}Context value must be provided. You likely forgot to return it from the factory function.`,
				);
			}

			const memoValue = useMemo(
				() => (enabled ? value : null),
				[enabled, value],
			);

			const storeRef = useRef<MutableProviderStoreApi<ContextValue> | null>(
				null,
			);
			const pendingNotifyRef = useRef(false);

			if (storeRef.current === null) {
				storeRef.current = createProviderStore<ContextValue>(memoValue);
			}
			const store = storeRef.current;

			pendingNotifyRef.current =
				store.setSnapshot(memoValue) || pendingNotifyRef.current;

			useLayoutEffect(() => {
				if (!pendingNotifyRef.current) {
					return;
				}

				pendingNotifyRef.current = false;
				store.notify();
			});

			// Per-instance ref ensures InnerProvider reads latest value while keeping
			// a stable component reference.
			const valueRef = useRef<ContextValue | null>(memoValue);
			valueRef.current = memoValue;

			const InnerProvider = useMemo((): InnerProviderComponent => {
				const NamedInnerProvider: InnerProviderComponent = ({ children }) => (
					<StoreContext.Provider value={store}>
						<Context.Provider value={valueRef.current}>
							{children}
						</Context.Provider>
					</StoreContext.Provider>
				);

				NamedInnerProvider.displayName = innerProviderDisplayName;

				return NamedInnerProvider;
			}, [store]);

			if (typeof children === "function") {
				return children({
					[`${name}Provider`]: InnerProvider,
				} as { [K in ProviderName as `${K}Provider`]: InnerProviderComponent });
			}

			return (
				<StoreContext.Provider value={store}>
					<Context.Provider value={memoValue}>{children}</Context.Provider>
				</StoreContext.Provider>
			);
		};
		Provider.displayName = providerDisplayName;

		const useEnhancedContext = (): ContextValue | null => {
			const context = useContext(Context);

			if (guarded && context === null) {
				throw new Error(
					`${name} context must be used within a ${name}Provider`,
				);
			}

			return context;
		};

		const useStoreSelector = <Selected,>(
			selector?: (value: ContextValue | null) => Selected,
		): Selected | ContextValue | null => {
			const store = useContext(StoreContext);
			const resolvedStore =
				store ?? (NullProviderStore as ProviderStoreApi<ContextValue>);
			const selectorRef = useRef<typeof selector>(selector);
			selectorRef.current = selector;

			const getSelectedSnapshot = useCallback(() => {
				if (guarded && store === null) {
					throw new Error(
						`${name} store must be used within a ${name}Provider`,
					);
				}

				const snapshot = resolvedStore.getSnapshot();

				if (guarded && snapshot === null) {
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

		const useOptionalStoreSelector = <Selected,>(
			selector?: (value: ContextValue | null) => Selected,
		): Selected | ContextValue | null => {
			const store = useContext(StoreContext);
			const resolvedStore =
				store ?? (NullProviderStore as ProviderStoreApi<ContextValue>);
			const selectorRef = useRef<typeof selector>(selector);
			selectorRef.current = selector;

			const getSelectedSnapshot = useCallback(() => {
				const snapshot = resolvedStore.getSnapshot();
				return selectorRef.current ? selectorRef.current(snapshot) : snapshot;
			}, [resolvedStore]);

			return useSyncExternalStore(
				resolvedStore.subscribe,
				getSelectedSnapshot,
				getSelectedSnapshot,
			);
		};

		return {
			[`${name}Context`]: Context,
			[`${name}StoreContext`]: StoreContext,
			[`${name}Provider`]: Provider,
			[`use${name}Context`]: useEnhancedContext,
			[`use${name}Store`]: useStoreSelector,
			[`use${name}OptionalStore`]: useOptionalStoreSelector,
		} as {
			[P in ProviderName as `${P}Context`]: React.Context<ContextValue>;
		} & {
			[P in ProviderName as `${P}StoreContext`]: React.Context<ProviderStoreApi<ContextValue> | null>;
		} & {
			[P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
		} & {
			[P in ProviderName as `use${P}Context`]: () => Guarded extends true
				? ContextValue
				: ContextValue | null;
		} & {
			[P in ProviderName as `use${P}Store`]: ProviderStoreHook<
				ContextValue,
				Guarded
			>;
		} & {
			[P in ProviderName as `use${P}OptionalStore`]: ProviderOptionalStoreHook<ContextValue>;
		};
	};
}
