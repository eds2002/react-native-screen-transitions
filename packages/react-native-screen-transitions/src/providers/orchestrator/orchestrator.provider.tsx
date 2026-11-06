import { type ReactNode, useMemo } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	type SharedValue,
	useAnimatedRef,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useBoundaryMeasureCoordinator } from "../../components/boundary/coordinator/use-boundary-measure-coordinator";
import type { BoundaryPresentationValue } from "../../components/boundary/hooks/use-boundary-presentation";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import type { BoundsAccessor } from "../../types/bounds.types";
import { createBoundsAccessor } from "../../utils/bounds";
import createProvider from "../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionStore } from "../motion";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import { usePairPresentation } from "./helpers/use-pair-presentation";
import { useRegisterGestureOwnership } from "./hooks/use-register-gesture-ownership";
import {
	applyBoundsScreenFrames,
	areScreenTransformsEqual,
	IDENTITY_SCREEN_TRANSFORM,
	readScreenTransform,
	type ScreenTransform,
} from "./styles/helpers/bounds-screen-frames";
import { useRegisterScreenTransform } from "./styles/helpers/screen-transform-registry";
import { useInterpolatedStylesMap } from "./styles/hooks/use-interpolated-style-maps";
import { useResolvedStylesMap } from "./styles/hooks/use-resolved-slot-style-map";

export type OrchestratorProviderProps = {
	children: ReactNode;
	/** Reuse an existing screen’s orchestration without rebuilding it. */
	screenKey?: string;
};

export type OrchestratorState = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	boundsAccessor: BoundsAccessor;
	pairPresentation: ReturnType<typeof usePairPresentation>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	/** Where this screen draws its content this frame (translation and scale). */
	screenTransform: SharedValue<ScreenTransform>;
	contentMeasureRef: AnimatedRef<View>;
	/** What boundaries outside any transition present: no pair, this screen's slots. */
	idleBoundaryPresentation: SharedValue<BoundaryPresentationValue>;
};

export const {
	OrchestratorProvider,
	useOptionalOrchestratorStore,
	useOrchestratorStore,
} = createProvider("Orchestrator", {
	global: true,
})<OrchestratorProviderProps, OrchestratorState>(({ screenKey }) => {
	const currentScreenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const gestures = useMotionStore((store) => store.gestures);

	const pipeline = useScreenAnimationPipeline();
	// A full-size view inside the screen's content (ContentLayer): boundary measurements measure it
	// too, to know where the screen was drawn when they were taken.
	const contentMeasureRef = useAnimatedRef<View>();

	const localStylesMaps = useInterpolatedStylesMap({ pipeline });
	const resolvedSlotsMap = useResolvedStylesMap({ localStylesMaps });
	const { screenInterpolatorProps } = pipeline;

	// Where this screen draws its content this frame, for the bounds elements of the screens it
	// shares them with (see applyBoundsScreenFrames).
	const lastScreenTransform = useSharedValue<ScreenTransform>(
		IDENTITY_SCREEN_TRANSFORM,
	);
	const screenTransform = useDerivedValue<ScreenTransform>(() => {
		const screen = screenInterpolatorProps.get().layouts.screen;
		const next = readScreenTransform(
			resolvedSlotsMap.get().content?.style,
			screen.width,
			screen.height,
		);
		const previous = lastScreenTransform.get();
		if (areScreenTransformsEqual(previous, next)) return previous;
		lastScreenTransform.set(next);
		return next;
	});
	useRegisterScreenTransform(currentScreenKey, screenTransform, !screenKey);
	const previousScreenKey = useBuilderStore(
		(store) => store.derivations.previousScreenKey,
	);
	const nextScreenKey = useBuilderStore(
		(store) => store.derivations.nextScreenKey,
	);
	const previousScreenTransform = useOptionalOrchestratorStore(
		previousScreenKey ?? null,
		(store) => store.screenTransform,
	);
	const nextScreenTransform = useOptionalOrchestratorStore(
		nextScreenKey ?? null,
		(store) => store.screenTransform,
	);
	// The screens this one shares bounds with in its stack, by key (others are read by key).
	const screenTransforms = useDerivedValue<
		Record<string, ScreenTransform | undefined>
	>(() => {
		const transforms: Record<string, ScreenTransform | undefined> = {
			[currentScreenKey]: screenTransform.get(),
		};
		if (previousScreenKey) {
			transforms[previousScreenKey] = previousScreenTransform?.get();
		}
		if (nextScreenKey) {
			transforms[nextScreenKey] = nextScreenTransform?.get();
		}
		return transforms;
	});
	const slotsMap = useDerivedValue<NormalizedTransitionInterpolatedStyle>(() =>
		applyBoundsScreenFrames(resolvedSlotsMap.get(), screenTransforms.get()),
	);
	const pairPresentation = usePairPresentation(pipeline, screenTransforms);

	const idleBoundaryPresentation = useDerivedValue<BoundaryPresentationValue>(
		() => ({ owner: null, receiver: null, slots: slotsMap.get() }),
	);

	const boundsAccessor = useMemo(
		() =>
			createBoundsAccessor(() => {
				"worklet";
				return screenInterpolatorProps.get();
			}),
		[screenInterpolatorProps],
	);

	// One coordinator per screen measures its boundaries. An instance reusing another screen's
	// orchestration (the overlay) must not run a second one.
	useBoundaryMeasureCoordinator(!screenKey, contentMeasureRef);

	useRegisterGestureOwnership({
		claimedDirections: gestures.claimedDirections,
		owners: gestures.owners,
		source: gestures,
	});

	return {
		key: currentScreenKey,
		value: {
			...pipeline,
			pairPresentation,
			boundsAccessor,
			slotsMap,
			screenTransform,
			contentMeasureRef,
			idleBoundaryPresentation,
		},
	};
});
