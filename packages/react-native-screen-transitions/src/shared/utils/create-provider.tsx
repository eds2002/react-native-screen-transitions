/**
 * THANK YOU @MatiPl01
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/providers/utils/createProvider.tsx
 * SUPER COOL AMAZING UTILITY
 */
import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useRef,
} from "react";

type InnerProviderComponent = (props: { children: ReactNode }) => ReactNode;

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

		const Context = createContext<ContextValue | null>(null);
		Context.displayName = name;

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

			// Per-instance ref ensures InnerProvider reads latest value while keeping
			// a stable component reference.
			const valueRef = useRef<ContextValue | null>(memoValue);
			valueRef.current = memoValue;

			const InnerProvider = useMemo(
				(): InnerProviderComponent =>
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
				} as { [K in ProviderName as `${K}Provider`]: InnerProviderComponent });
			}

			return <Context.Provider value={memoValue}>{children}</Context.Provider>;
		};

		const useEnhancedContext = (): ContextValue | null => {
			const context = useContext(Context);

			if (guarded && context === null) {
				throw new Error(
					`${name} context must be used within a ${name}Provider`,
				);
			}

			return context;
		};

		return {
			[`${name}Context`]: Context,
			[`${name}Provider`]: Provider,
			[`use${name}Context`]: useEnhancedContext,
		} as {
			[P in ProviderName as `${P}Context`]: React.Context<ContextValue>;
		} & {
			[P in ProviderName as `${P}Provider`]: React.FC<ProviderProps>;
		} & {
			[P in ProviderName as `use${P}Context`]: () => Guarded extends true
				? ContextValue
				: ContextValue | null;
		};
	};
}
