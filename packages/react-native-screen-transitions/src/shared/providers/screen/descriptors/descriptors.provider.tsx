import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { getAncestorKeys } from "./helpers/get-ancestor-keys";
import { getAncestorNavigatorKeys } from "./helpers/get-ancestor-navigator-keys";

/**
 * Base descriptor interface - minimal contract for all stack types.
 * This allows blank-stack and native-stack to work with the shared
 * providers without tight coupling to React Navigation.
 */
export type BaseDescriptor = BaseStackDescriptor;

export interface DescriptorsContextValue<
	TDescriptor extends BaseDescriptor = BaseDescriptor,
> {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

export type DescriptorDerivationsContextValue = DescriptorDerivations;

interface DescriptorsProviderProps<TDescriptor extends BaseDescriptor> {
	children: ReactNode;
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

type InternalProviderProps = DescriptorsProviderProps<BaseDescriptor>;

const {
	DescriptorsProvider: InternalDescriptorsProvider,
	useDescriptorsContext,
} = createProvider("Descriptors", { guarded: true })<
	InternalProviderProps,
	DescriptorsContextValue<BaseDescriptor>
>(({ previous, current, next }) => {
	const value = useMemo(
		() => ({ previous, current, next }),
		[previous, current, next],
	);

	return {
		value,
	};
});

const {
	DescriptorDerivationsProvider: InternalDescriptorDerivationsProvider,
	useDescriptorDerivationsContext,
} = createProvider("DescriptorDerivations", { guarded: true })<
	InternalProviderProps,
	DescriptorDerivationsContextValue
>(({ previous, current, next, children }) => {
	const ancestorKeys = useMemo(() => getAncestorKeys(current), [current]);
	const ancestorNavigatorKeys = useMemo(
		() => getAncestorNavigatorKeys(current),
		[current],
	);

	const value = useMemo(
		() =>
			deriveDescriptorDerivations({
				previous,
				current,
				next,
				ancestorKeys,
				ancestorNavigatorKeys,
			}),
		[previous, current, next, ancestorKeys, ancestorNavigatorKeys],
	);

	return {
		value,
		children,
	};
});

export function DescriptorsProvider<TDescriptor extends BaseDescriptor>({
	children,
	previous,
	current,
	next,
}: DescriptorsProviderProps<TDescriptor>) {
	const providerProps = {
		previous,
		current,
		next,
	};

	return (
		<InternalDescriptorsProvider {...providerProps}>
			<InternalDescriptorDerivationsProvider {...providerProps}>
				{children}
			</InternalDescriptorDerivationsProvider>
		</InternalDescriptorsProvider>
	);
}

export function useDescriptors<
	TDescriptor extends BaseDescriptor = BaseDescriptor,
>() {
	return useDescriptorsContext() as DescriptorsContextValue<TDescriptor>;
}

export function useDescriptorDerivations(): DescriptorDerivationsContextValue {
	return useDescriptorDerivationsContext();
}
