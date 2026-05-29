import { type ReactNode, useCallback, useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import { createBoundsAccessor } from "../../../utils/bounds";
import createProvider from "../../../utils/create-provider";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import type {
	RegisterScreenAnimationDescendant,
	ScreenAnimationAncestorDescendantRegistrar,
	ScreenAnimationDescendantSources,
	ScreenAnimationSource,
	ScreenAnimationTransitionSource,
} from "./types";

type Props = {
	children: ReactNode;
};

export type ScreenAnimationContextValue = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	ancestorScreenAnimationSources: ScreenAnimationSource[];
	descendantScreenAnimationSources: ScreenAnimationDescendantSources;
	registerDescendantScreenAnimationSource: RegisterScreenAnimationDescendant;
	ancestorDescendantScreenAnimationRegistrars: ScreenAnimationAncestorDescendantRegistrar[];
};

export type ScreenAnimationContextResult = {
	value: ScreenAnimationContextValue;
};

export const {
	ScreenAnimationProvider,
	ScreenAnimationContext,
	useScreenAnimationContext,
	useScreenAnimationStore,
	useScreenAnimationOptionalStore,
} = createProvider("ScreenAnimation", {
	guarded: true,
})<Props, ScreenAnimationContextValue>((): ScreenAnimationContextResult => {
	const parentScreenInterpolatorProps = useScreenAnimationOptionalStore(
		(parent) => parent?.screenInterpolatorProps,
	);
	const parentScreenInterpolatorPropsRevision = useScreenAnimationOptionalStore(
		(parent) => parent?.screenInterpolatorPropsRevision,
	);
	const parentAncestorScreenAnimationSources = useScreenAnimationOptionalStore(
		(parent) => parent?.ancestorScreenAnimationSources,
	);
	const parentRegisterDescendantScreenAnimationSource =
		useScreenAnimationOptionalStore(
			(parent) => parent?.registerDescendantScreenAnimationSource,
		);
	const parentAncestorDescendantScreenAnimationRegistrars =
		useScreenAnimationOptionalStore(
			(parent) => parent?.ancestorDescendantScreenAnimationRegistrars,
		);

	const {
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		selectedInterpolatorOptions,
		nextInterpolator,
		currentInterpolator,
	} = useScreenAnimationPipeline();

	const selfScreenAnimationSource = useMemo<ScreenAnimationSource>(
		() => ({
			screenInterpolatorProps,
			screenInterpolatorPropsRevision,
		}),
		[screenInterpolatorProps, screenInterpolatorPropsRevision],
	);

	const selfScreenAnimationTransitionSource =
		useMemo<ScreenAnimationTransitionSource>(
			() => ({
				...selfScreenAnimationSource,
				boundsAccessor: createBoundsAccessor(() => {
					"worklet";
					return selfScreenAnimationSource.screenInterpolatorProps.get();
				}),
			}),
			[selfScreenAnimationSource],
		);

	const descendantScreenAnimationSources = useSharedValue<
		ScreenAnimationDescendantSources["value"]
	>([]);

	const registerDescendantScreenAnimationSource =
		useCallback<RegisterScreenAnimationDescendant>(
			(source, depth) => {
				descendantScreenAnimationSources.modify(
					<T extends ScreenAnimationDescendantSources["value"]>(
						currentSources: T,
					): T => {
						"worklet";
						const existingIndex = currentSources.findIndex(
							(currentSource) => currentSource.source === source,
						);

						if (
							existingIndex !== -1 &&
							currentSources[existingIndex]?.depth === depth
						) {
							return currentSources;
						}

						const nextSources =
							existingIndex === -1
								? [...currentSources, { source, depth }]
								: currentSources.map((currentSource, index) =>
										index === existingIndex ? { source, depth } : currentSource,
									);

						return nextSources.sort((a, b) => a.depth - b.depth) as T;
					},
				);

				return () => {
					descendantScreenAnimationSources.modify(
						<T extends ScreenAnimationDescendantSources["value"]>(
							currentSources: T,
						): T => {
							"worklet";
							return currentSources.filter(
								(currentSource) => currentSource.source !== source,
							) as T;
						},
					);
				};
			},
			[descendantScreenAnimationSources],
		);

	const ancestorScreenAnimationSources = useMemo(() => {
		if (
			!parentScreenInterpolatorProps ||
			!parentScreenInterpolatorPropsRevision ||
			!parentAncestorScreenAnimationSources
		) {
			return [];
		}

		return [
			{
				screenInterpolatorProps: parentScreenInterpolatorProps,
				screenInterpolatorPropsRevision: parentScreenInterpolatorPropsRevision,
			},
			...parentAncestorScreenAnimationSources,
		];
	}, [
		parentScreenInterpolatorProps,
		parentScreenInterpolatorPropsRevision,
		parentAncestorScreenAnimationSources,
	]);

	const ancestorDescendantScreenAnimationRegistrars = useMemo(() => {
		if (!parentRegisterDescendantScreenAnimationSource) {
			return [];
		}

		// Each provider exposes its own descendant registrar and forwards ancestor
		// registrars, letting a mounted child register with every ancestor scope.
		return [
			{
				register: parentRegisterDescendantScreenAnimationSource,
				depth: 1,
			},
			...(parentAncestorDescendantScreenAnimationRegistrars ?? []).map(
				(registrar) => ({
					register: registrar.register,
					depth: registrar.depth + 1,
				}),
			),
		];
	}, [
		parentRegisterDescendantScreenAnimationSource,
		parentAncestorDescendantScreenAnimationRegistrars,
	]);

	useLayoutEffect(() => {
		const cleanups = ancestorDescendantScreenAnimationRegistrars.map(
			(registrar) =>
				registrar.register(
					selfScreenAnimationTransitionSource,
					registrar.depth,
				),
		);

		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}
		};
	}, [
		ancestorDescendantScreenAnimationRegistrars,
		selfScreenAnimationTransitionSource,
	]);

	const value = useMemo<ScreenAnimationContextValue>(
		() => ({
			screenInterpolatorProps,
			screenInterpolatorPropsRevision,
			selectedInterpolatorOptions,
			nextInterpolator,
			currentInterpolator,
			ancestorScreenAnimationSources,
			descendantScreenAnimationSources,
			registerDescendantScreenAnimationSource,
			ancestorDescendantScreenAnimationRegistrars,
		}),
		[
			screenInterpolatorProps,
			screenInterpolatorPropsRevision,
			selectedInterpolatorOptions,
			nextInterpolator,
			currentInterpolator,
			ancestorScreenAnimationSources,
			descendantScreenAnimationSources,
			registerDescendantScreenAnimationSource,
			ancestorDescendantScreenAnimationRegistrars,
		],
	);

	return {
		value,
	};
});
