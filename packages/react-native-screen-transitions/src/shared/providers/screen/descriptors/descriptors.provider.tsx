import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { getAncestorKeys } from "./helpers/get-ancestor-keys";

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

export const { DescriptorsProvider, useDescriptorsStore } = createProvider(
	"Descriptors",
	{ guarded: true },
)<
	DescriptorsProviderProps<BaseDescriptor>,
	DescriptorStoreValue<BaseDescriptor>
>(({ previous, current, next, children }) => {
	const descriptors = useMemo(
		() => ({ previous, current, next }),
		[previous, current, next],
	);

	const ancestorKeys = useMemo(() => getAncestorKeys(current), [current]);

	const derivations = useMemo(
		() =>
			deriveDescriptorDerivations({
				previous,
				current,
				next,
				ancestorKeys,
			}),
		[previous, current, next, ancestorKeys],
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
