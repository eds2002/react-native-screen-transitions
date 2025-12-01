/**
 * THANK YOU @MatiPl01
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/providers/utils/createProvider.tsx
 * SUPER COOL AMAZING UTILITY
 */
import {
	createContext,
	type PropsWithChildren,
	type ReactNode,
	useContext,
	useMemo,
} from "react";

export default function createProvider<
	ProviderName extends string,
	Guarded extends boolean = true,
>(name: ProviderName, options?: { guarded?: Guarded }) {
	return <ProviderProps extends object, ContextValue>(
		factory: (props: ProviderProps) => {
			value?: ContextValue;
			enabled?: boolean;
			children?: ReactNode;
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
