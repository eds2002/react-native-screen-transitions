import type { ReactNode } from "react";
import { useLayoutEffect, useMemo } from "react";
import { useScreenTransitionsAdapterOptionalContext } from "../../../adapters/with-screen-transitions/context";
import { screenTopology } from "../../../factories/screen-topology";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useOptionalBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";

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

const createDescriptorsProvider = createProvider("Descriptors", {
	global: true,
})<DescriptorsProviderProps, DescriptorStoreValue<BaseDescriptor>>;

export const {
	DescriptorsProvider,
	useDescriptorsStore,
	useOptionalDescriptorsStore,
}: ReturnType<typeof createDescriptorsProvider> = createDescriptorsProvider(
	({ previous, current, next, routeKey, children }) => {
		const parentScreenKey = useOptionalDescriptorsStore(
			(store) => store?.derivations.currentScreenKey,
		);
		const blankStackCurrent = useOptionalBlankStackStore((store) =>
			routeKey ? store?.scenesByKey[routeKey]?.descriptor : undefined,
		);
		const blankStackPrevious = useOptionalBlankStackStore((store) =>
			routeKey ? store?.scenesByKey[routeKey]?.previousDescriptor : undefined,
		);
		const blankStackNext = useOptionalBlankStackStore((store) =>
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
		const currentScreenKey = current?.route.key ?? routeKey;
		const isActiveScreen = useStack((store) => {
			const focusedScene = store.scenes[store.focusedIndex];
			return (
				focusedScene?.route.key === currentScreenKey &&
				focusedScene.activity === "active"
			);
		});

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

		const derivations = useMemo(
			() =>
				deriveDescriptorDerivations({
					previous: resolvedPrevious,
					current: resolvedCurrent,
					next: resolvedNext,
				}),
			[resolvedPrevious, resolvedCurrent, resolvedNext],
		);

		useLayoutEffect(() => {
			screenTopology.register({
				screenKey: derivations.currentScreenKey,
				parentScreenKey,
			});

			return () => {
				screenTopology.unregister(derivations.currentScreenKey);
			};
		}, [derivations.currentScreenKey, parentScreenKey]);

		useLayoutEffect(() => {
			if (!isActiveScreen || !parentScreenKey) {
				return;
			}

			return screenTopology.activate({
				screenKey: derivations.currentScreenKey,
				parentScreenKey,
			});
		}, [isActiveScreen, derivations.currentScreenKey, parentScreenKey]);

		return {
			key: derivations.currentScreenKey,
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
