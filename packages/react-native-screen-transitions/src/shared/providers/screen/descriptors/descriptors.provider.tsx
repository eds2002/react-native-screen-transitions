import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { getAncestorKeyState } from "./helpers/get-ancestor-keys";

/**
 * Base descriptor interface - minimal contract for all stack types.
 * This allows stack implementations to work with the shared providers without
 * tight coupling to React Navigation.
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

interface DescriptorStoreValue<
	TDescriptor extends BaseDescriptor = BaseDescriptor,
> {
	descriptors: DescriptorsContextValue<TDescriptor>;
	derivations: DescriptorDerivationsContextValue;
}

interface DescriptorsProviderProps<TDescriptor extends BaseDescriptor> {
	children: ReactNode;
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

const {
	DescriptorsProvider: InternalDescriptorsProvider,
	useDescriptorsStore,
} = createProvider("Descriptors", { guarded: true })<
	DescriptorsProviderProps<BaseDescriptor>,
	DescriptorStoreValue<BaseDescriptor>
>(({ previous, current, next, children }) => {
	const descriptors = useMemo(
		() => ({ previous, current, next }),
		[previous, current, next],
	);

	const { ancestorKeys, ancestorDestinationPairKey } = useMemo(
		() => getAncestorKeyState(current),
		[current],
	);

	const derivations = useMemo(
		() =>
			deriveDescriptorDerivations({
				previous,
				current,
				next,
				ancestorKeys,
				ancestorDestinationPairKey,
			}),
		[previous, current, next, ancestorKeys, ancestorDestinationPairKey],
	);

	const value = useMemo(
		() => ({
			descriptors,
			derivations,
		}),
		[descriptors, derivations],
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
		children,
	};

	return <InternalDescriptorsProvider {...providerProps} />;
}

export function useDescriptors<
	TDescriptor extends BaseDescriptor = BaseDescriptor,
>() {
	return useDescriptorsStore(
		(store) => store.descriptors,
	) as DescriptorsContextValue<TDescriptor>;
}

export function useDescriptorDerivations(): DescriptorDerivationsContextValue {
	return useDescriptorsStore((store) => store.derivations);
}

export { useDescriptorsStore };
