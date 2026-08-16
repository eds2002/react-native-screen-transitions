import type { ReactNode } from "react";
import { useLayoutEffect, useMemo } from "react";
import { screenTopology } from "../../../factories/screen-topology";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
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

export interface DescriptorsContextValue {
	previous?: BaseDescriptor;
	current: BaseDescriptor;
	next?: BaseDescriptor;
}

export type DescriptorDerivationsContextValue = DescriptorDerivations;

interface DescriptorStoreValue extends DescriptorsContextValue {
	descriptors: DescriptorsContextValue;
	derivations: DescriptorDerivationsContextValue;
	options: BaseDescriptor["options"];
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
})<DescriptorsProviderProps, DescriptorStoreValue>;

const {
	DescriptorsProvider,
	useDescriptorsStore,
	useOptionalDescriptorsStore,
}: ReturnType<typeof createDescriptorsProvider> = createDescriptorsProvider(
	({ previous, current, next, routeKey, children }) => {
		const parentScreenKey = useOptionalDescriptorsStore(
			(store) => store?.derivations.currentScreenKey,
		);
		const blankStackCurrent = useBlankStackStore((store) =>
			routeKey ? store.scenesByKey[routeKey]?.descriptor : undefined,
		);
		const blankStackPrevious = useBlankStackStore((store) =>
			routeKey ? store.scenesByKey[routeKey]?.previousDescriptor : undefined,
		);
		const blankStackNext = useBlankStackStore((store) =>
			routeKey ? store.scenesByKey[routeKey]?.nextDescriptor : undefined,
		);
		const blankStackFocusedScene = useBlankStackStore(
			(store) => store.scenes[store.focusedIndex],
		);
		const resolvedCurrent = current ?? blankStackCurrent;
		const resolvedPrevious = previous ?? blankStackPrevious;
		const resolvedNext = next ?? blankStackNext;
		const currentScreenKey = current?.route.key ?? routeKey;
		const focusedScene = blankStackFocusedScene;
		const isActiveScreen =
			focusedScene?.route.key === currentScreenKey &&
			focusedScene?.activity === "active";

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

export { DescriptorsProvider, useDescriptorsStore };
