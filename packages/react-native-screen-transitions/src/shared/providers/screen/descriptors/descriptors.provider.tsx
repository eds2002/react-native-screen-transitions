import type { ReactNode } from "react";
import { useLayoutEffect, useMemo } from "react";
import { runOnUI } from "react-native-reanimated";
import { useScreenTransitionsAdapterOptionalContext } from "../../../adapters/with-screen-transitions/context";
import { screenTopology } from "../../../factories/screen-topology";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useOptionalBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import {
	registerScreen,
	unregisterScreen,
} from "../../../stores/bounds/internals/coordinator";
import { SystemStore } from "../../../stores/system.store";
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

const {
	DescriptorsProvider,
	useDescriptorsStore,
	useOptionalDescriptorsStore,
}: ReturnType<typeof createDescriptorsProvider> = createDescriptorsProvider(
	({ previous, current, next, routeKey, children }) => {
		const parentScreenKey = useOptionalDescriptorsStore(
			(store) => store?.derivations.currentScreenKey,
		);
		const parentTransitionSourcePairKey = useOptionalDescriptorsStore(
			(store) => store?.derivations.transitionSourcePairKey,
		);
		const parentTransitionDestinationScreenKey = useOptionalDescriptorsStore(
			(store) => store?.derivations.transitionDestinationScreenKey,
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
			const focusedScene = store.scenes[
				store.focusedIndex
			] as (typeof store.scenes)[number];

			return (
				focusedScene.route.key === currentScreenKey &&
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

		const derivations = useMemo(() => {
			const localDerivations = deriveDescriptorDerivations({
				previous: resolvedPrevious,
				current: resolvedCurrent,
				next: resolvedNext,
			});

			return {
				...localDerivations,
				transitionSourcePairKey:
					localDerivations.sourcePairKey ??
					parentTransitionSourcePairKey ??
					undefined,
				transitionDestinationScreenKey:
					localDerivations.nextScreenKey ??
					parentTransitionDestinationScreenKey ??
					undefined,
			};
		}, [
			resolvedPrevious,
			resolvedCurrent,
			resolvedNext,
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
			screenTopology.register({
				screenKey: derivations.currentScreenKey,
				parentScreenKey,
			});
			runOnUI(registerScreen)({
				screenKey: derivations.currentScreenKey,
				parentScreenKey,
				animationProgress,
				pendingLifecycleStartBlockCount,
			});

			return () => {
				screenTopology.unregister(derivations.currentScreenKey);
				runOnUI(unregisterScreen)(derivations.currentScreenKey);
			};
		}, [
			animationProgress,
			derivations.currentScreenKey,
			parentScreenKey,
			pendingLifecycleStartBlockCount,
		]);

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

export { DescriptorsProvider, useDescriptorsStore };
