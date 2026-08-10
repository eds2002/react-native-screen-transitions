import type { ReactNode } from "react";
import { useLayoutEffect, useMemo } from "react";
import { runOnUI } from "react-native-reanimated";
import { useScreenTransitionsAdapterOptionalContext } from "../../../adapters/with-screen-transitions/context";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import {
	registerScreen,
	unregisterScreen,
} from "../../../stores/bounds/internals/coordinator";
import { SystemStore } from "../../../stores/system.store";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveStructuralAncestorKeys } from "./helpers/derive-structural-ancestor-keys";

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
	({ previous, current, next, routeKey, children }, { useParentStore }) => {
		const parentScreenKey = useParentStore(
			(store) => store?.derivations.currentScreenKey,
		);
		const parentAncestorKeys = useParentStore(
			(store) => store?.derivations.ancestorKeys,
		);
		const parentTransitionSourcePairKey = useParentStore(
			(store) => store?.derivations.transitionSourcePairKey,
		);
		const parentTransitionDestinationScreenKey = useParentStore(
			(store) => store?.derivations.transitionDestinationScreenKey,
		);
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
			() =>
				deriveStructuralAncestorKeys(
					parentScreenKey
						? {
								currentScreenKey: parentScreenKey,
								ancestorKeys: parentAncestorKeys ?? [],
							}
						: null,
				),
			[parentAncestorKeys, parentScreenKey],
		);

		const derivations = useMemo(() => {
			const localDerivations = deriveDescriptorDerivations({
				previous: resolvedPrevious,
				current: resolvedCurrent,
				next: resolvedNext,
				ancestorKeys,
			});

			return {
				...localDerivations,
				transitionSourcePairKey:
					localDerivations.sourcePairKey ?? parentTransitionSourcePairKey,
				transitionDestinationScreenKey:
					localDerivations.nextScreenKey ??
					parentTransitionDestinationScreenKey,
			};
		}, [
			resolvedPrevious,
			resolvedCurrent,
			resolvedNext,
			ancestorKeys,
			parentTransitionSourcePairKey,
			parentTransitionDestinationScreenKey,
		]);
		const animationProgress = SystemStore.getValue(
			derivations.currentScreenKey,
			"animationProgress",
		);
		const pendingLifecycleStartBlockCount = SystemStore.getValue(
			derivations.currentScreenKey,
			"pendingLifecycleStartBlockCount",
		);

		useLayoutEffect(() => {
			runOnUI(registerScreen)({
				screenKey: derivations.currentScreenKey,
				parentScreenKey: derivations.parentScreenKey,
				animationProgress,
				pendingLifecycleStartBlockCount,
			});

			return () => {
				runOnUI(unregisterScreen)(derivations.currentScreenKey);
			};
		}, [
			animationProgress,
			derivations.currentScreenKey,
			derivations.parentScreenKey,
			pendingLifecycleStartBlockCount,
		]);

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
