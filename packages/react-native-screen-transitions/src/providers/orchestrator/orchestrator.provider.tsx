import { type ReactNode, useMemo } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	type SharedValue,
	type StyleProps,
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
import { useOptionalScreenHostStore } from "../host/screen-host.provider";
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
	// shares them with (see applyBoundsScreenFrames). From its own interpolator's content style only
	// (the local layers, the last that sets a transform): its resolved styles inherit its parent
	// screen's, which may read this screen's transform (a pair across a nested stack).
	const lastScreenTransform = useSharedValue<ScreenTransform>(
		IDENTITY_SCREEN_TRANSFORM,
	);
	const screenTransform = useDerivedValue<ScreenTransform>(() => {
		const screen = screenInterpolatorProps.get().layouts.screen;
		const layers = localStylesMaps.get();
		let contentStyle: StyleProps | undefined;
		for (let index = 0; index < layers.length; index++) {
			const style = layers[index]?.content?.style;
			if (style?.transform !== undefined) contentStyle = style;
		}
		const next = readScreenTransform(contentStyle, screen.width, screen.height);
		const previous = lastScreenTransform.get();
		if (areScreenTransformsEqual(previous, next)) return previous;
		lastScreenTransform.set(next);
		return next;
	});
	useRegisterScreenTransform(currentScreenKey, screenTransform, !screenKey);
	// The screens this one may share bound elements with: its stack's (closing ones included), read
	// the same frame (a declared dependency: computed before this screen's styles).
	const scenes = useOptionalScreenHostStore((store) => store?.scenes);
	const stackKeys = useMemo(
		() => scenes?.map((scene) => scene.route.key) ?? [currentScreenKey],
		[scenes, currentScreenKey],
	);
	const stackScreenTransforms = useOptionalOrchestratorStore(
		stackKeys,
		(store) => store.screenTransform,
	);
	const screenTransforms = useDerivedValue<
		Record<string, ScreenTransform | undefined>
	>(() => {
		const transforms: Record<string, ScreenTransform | undefined> = {};
		for (let index = 0; index < stackKeys.length; index++) {
			transforms[stackKeys[index]] = stackScreenTransforms[index]?.get();
		}
		transforms[currentScreenKey] = screenTransform.get();
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
	useBoundaryMeasureCoordinator(!screenKey, contentMeasureRef, slotsMap);

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
