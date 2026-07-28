import type { ReactNode } from "react";
import { useMemo } from "react";
import { useScreenTransitionsAdapterOptionalContext } from "../../../adapters/with-screen-transitions/context";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
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
> extends DescriptorsContextValue<TDescriptor> {
	descriptors: DescriptorsContextValue<TDescriptor>;
	derivations: DescriptorDerivationsContextValue;
	options: TDescriptor["options"];
}

type DescriptorsProviderProps = {
	children: ReactNode;
	previous?: BaseDescriptor;
	current?: BaseDescriptor;
	next?: BaseDescriptor;
	routeKey?: string;
};

export const { DescriptorsProvider, useDescriptorsStore } = createProvider(
	"Descriptors",
	{ guarded: true },
)<DescriptorsProviderProps, DescriptorStoreValue<BaseDescriptor>>(
	({ previous, current, next, routeKey, children }) => {
		const blankStackCurrent = useBlankStackStore((store) =>
			routeKey ? store?.scenesByKey[routeKey]?.descriptor : undefined,
		);
		const blankStackPrevious = useBlankStackStore((store) =>
			routeKey ? store?.scenesByKey[routeKey]?.previousDescriptor : undefined,
		);
		const blankStackNext = useBlankStackStore((store) =>
			routeKey ? store?.scenesByKey[routeKey]?.nextDescriptor : undefined,
		);
		const adapterContext = useScreenTransitionsAdapterOptionalContext();
		const adapterScene = routeKey
			? (adapterContext?.scenesByKey?.[routeKey] ??
				adapterContext?.scenes[
					adapterContext.routeIndexByKey.get(routeKey) ?? -1
				])
			: undefined;

		const resolvedCurrent =
			current ?? blankStackCurrent ?? adapterScene?.descriptor;
		const resolvedPrevious =
			previous ?? blankStackPrevious ?? adapterScene?.previousDescriptor;
		const resolvedNext = next ?? blankStackNext ?? adapterScene?.nextDescriptor;

		if (!resolvedCurrent) {
			throw new Error(
				`Descriptors scene "${routeKey ?? "unknown"}" was not found.`,
			);
		}

		const descriptors = useMemo(
			() => ({
				previous: resolvedPrevious,
				current: resolvedCurrent,
				next: resolvedNext,
			}),
			[resolvedPrevious, resolvedCurrent, resolvedNext],
		);

		const ancestorKeys = useMemo(
			() => getAncestorKeys(resolvedCurrent),
			[resolvedCurrent],
		);

		const derivations = useMemo(
			() =>
				deriveDescriptorDerivations({
					previous: resolvedPrevious,
					current: resolvedCurrent,
					next: resolvedNext,
					ancestorKeys,
				}),
			[resolvedPrevious, resolvedCurrent, resolvedNext, ancestorKeys],
		);

		return {
			value: {
				previous: resolvedPrevious,
				current: resolvedCurrent,
				next: resolvedNext,
				descriptors,
				derivations,
				options: resolvedCurrent.options,
			},
			children,
		};
	},
);
