/**
 * THANK YOU @MatiPl01
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/providers/utils/createProvider.tsx
 * SUPER COOL AMAZING UTILITY
 */
import {
	type ComponentType,
	type Context,
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useRef,
} from "react";

type ChildrenComponent = (props: { children: ReactNode }) => ReactNode;

type InnerProviderMap<Name extends string> = {
	[K in Name as `${K}Provider`]: ChildrenComponent;
};

type FactoryResult<ContextValue, Name extends string> = {
	value?: ContextValue;
	enabled?: boolean;
	children?: ReactNode | ((props: InnerProviderMap<Name>) => ReactNode);
};

type ProviderReturn<
	Name extends string,
	Props extends object,
	Value,
	Guarded extends boolean,
> = {
	[K in Name as `${K}Context`]: Context<Value | null>;
} & {
	[K in Name as `${K}Provider`]: ChildrenComponent & Props;
} & {
	[K in Name as `use${K}Context`]: () => Guarded extends true
		? Value
		: Value | null;
} & {
	[K in Name as `with${K}Provider`]: (
		Component: ComponentType<Value>,
	) => (props: Props) => ReactNode;
};

export default function createProvider<
	ProviderName extends string,
	Guarded extends boolean = true,
>(name: ProviderName, options?: { guarded?: Guarded }) {
	return <ProviderProps extends object, ContextValue>(
		factory: (props: ProviderProps) => FactoryResult<ContextValue, ProviderName>,
	) => {
		const { guarded = true } = options ?? {};

		const Context = createContext<ContextValue | null>(null);
		Context.displayName = name;

		function Provider(props: ProviderProps) {
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

			// Per-instance ref and stable InnerProvider
			const valueRef = useRef<ContextValue | null>(memoValue);
			valueRef.current = memoValue;

			const InnerProvider = useMemo(
				(): ChildrenComponent =>
					({ children }) => (
						<Context.Provider value={valueRef.current}>
							{children}
						</Context.Provider>
					),
				[],
			);

			if (typeof children === "function") {
				return children({
					[`${name}Provider`]: InnerProvider,
				} as InnerProviderMap<ProviderName>);
			}

			return <Context.Provider value={memoValue}>{children}</Context.Provider>;
		}

		function useEnhancedContext() {
			const context = useContext(Context);

			if (guarded && context === null) {
				throw new Error(
					`${name} context must be used within a ${name}Provider`,
				);
			}

			return context;
		}

		function withProvider(Component: ComponentType<ContextValue>) {
			return function WithProviderWrapper(props: ProviderProps) {
				const { enabled = true, value } = factory(props);

				if (!value) {
					throw new Error(
						`${name}Context value must be provided. You likely forgot to return it from the factory function.`,
					);
				}

				const memoValue = useMemo(
					() => (enabled ? value : null),
					[enabled, value],
				);

				return (
					<Context.Provider value={memoValue}>
						<Component {...value} />
					</Context.Provider>
				);
			};
		}

		return {
			[`${name}Context`]: Context,
			[`${name}Provider`]: Provider,
			[`use${name}Context`]: useEnhancedContext,
			[`with${name}Provider`]: withProvider,
		} as ProviderReturn<ProviderName, ProviderProps, ContextValue, Guarded>;
	};
}
