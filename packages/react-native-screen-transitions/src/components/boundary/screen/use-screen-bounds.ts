import { useLayoutEffect, useMemo } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	type DerivedValue,
	type SharedValue,
	type StyleProps,
	useAnimatedRef,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import {
	screenTopology,
	useScreenRelationships,
} from "../../../providers/builder/topology";
import { useOptionalScreenHostStore } from "../../../providers/host/screen-host.provider";
import type { ScreenAnimationPipeline } from "../../../providers/orchestrator/helpers/pipeline";
import { useOptionalOrchestratorStore } from "../../../providers/orchestrator/orchestrator.provider";
import type { LocalStyleLayers } from "../../../providers/orchestrator/styles/helpers/resolve-slot-styles";
import type { InterpolatorRuns } from "../../../providers/orchestrator/styles/hooks/use-interpolated-style-maps";
import {
	pairs,
	registerScreenScroll,
	registerScreenTransform,
	unregisterScreenScroll,
	unregisterScreenTransform,
} from "../../../stores/bounds";
import { ScrollStore } from "../../../stores/scroll.store";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import type { BoundsAccessor } from "../../../types/bounds.types";
import { createBoundsAccessor } from "../../../utils/bounds";
import {
	areScreenTransformsEqual,
	composeScreenTransforms,
	IDENTITY_SCREEN_TRANSFORM,
	readScreenTransform,
	type ScreenTransform,
} from "../../../utils/bounds/helpers/screen-transform";
import { applyBoundsScreenFrames } from "../../../utils/bounds/helpers/styles/apply-screen-frames";
import { useBoundaryMeasureCoordinator } from "../measure/use-boundary-measure-coordinator";
import type { BoundaryPresentationValue } from "../presentation/use-boundary-presentation";
import { usePairPresentation } from "../presentation/use-pair-presentation";

const NO_SCREEN_TRANSFORMS: Record<string, ScreenTransform | undefined> = {};

/**
 * Whether any pair exists. A screen's transform is only read by bounds elements, which follow a
 * pair (their styles carry its screens' keys); with none, no transform is needed.
 */
const hasAnyPair = () => {
	"worklet";
	for (const _key in pairs.get()) return true;
	return false;
};

export type ScreenBounds = {
	boundsAccessor: BoundsAccessor;
	pairPresentation: ReturnType<typeof usePairPresentation>;
	/** The screen's slots with its bounds elements placed where their screens are drawn this frame. */
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	/** Where this screen draws its content this frame (translation and scale). */
	screenTransform: SharedValue<ScreenTransform>;
	contentMeasureRef: AnimatedRef<View>;
	/** What boundaries outside any transition present: no pair, this screen's slots. */
	idleBoundaryPresentation: SharedValue<BoundaryPresentationValue>;
	/** This screen's interpolator runs, for the pair presentation of the screen it opens. */
	interpolatorRuns: DerivedValue<InterpolatorRuns>;
};

/**
 * Everything a screen does for its bounds elements: where it draws its content (for the elements of
 * the screens it shares them with), its slots with those elements placed, the presentations of the
 * pair it is the destination of, the interpolators' bounds accessor and the measuring of its
 * boundaries. `owner` is false for an instance reusing another screen's orchestration (the
 * overlay): it reads, but registers and measures nothing.
 */
export function useScreenBounds({
	currentScreenKey,
	owner,
	pipeline,
	localStylesMaps,
	interpolatorRuns,
	resolvedSlotsMap,
}: {
	currentScreenKey: string;
	owner: boolean;
	pipeline: ScreenAnimationPipeline;
	localStylesMaps: DerivedValue<LocalStyleLayers>;
	interpolatorRuns: DerivedValue<InterpolatorRuns>;
	resolvedSlotsMap: DerivedValue<NormalizedTransitionInterpolatedStyle>;
}): ScreenBounds {
	const { screenInterpolatorProps } = pipeline;
	// A full-size view inside the screen's content (ContentLayer): boundary measurements measure it
	// too, to know where the screen was drawn when they were taken.
	const contentMeasureRef = useAnimatedRef<View>();

	// Where this screen draws its content this frame, for the bounds elements of the screens it
	// shares them with (see applyBoundsScreenFrames). From its own interpolator's content style only
	// (the local layers, the last that sets a transform): its resolved styles inherit its parent
	// screen's, which may read this screen's transform (a pair across a nested stack).
	const lastScreenTransform = useSharedValue<ScreenTransform>(
		IDENTITY_SCREEN_TRANSFORM,
	);
	// The screens this one is drawn inside (a nested stack's screens are drawn in their stack's screen
	// in the stack above), nearest first: their transforms move it too.
	const { parentScreenKey } = useScreenRelationships(currentScreenKey);
	const ancestorKeys = useMemo(() => {
		const out: string[] = [];
		let key: string | null | undefined = parentScreenKey;
		while (key && !out.includes(key)) {
			out.push(key);
			key = screenTopology.getRelationships(key).parentScreenKey;
		}
		return out;
	}, [parentScreenKey]);
	const ancestorTransforms = useOptionalOrchestratorStore(
		ancestorKeys,
		(store) => store.screenTransform,
	);
	const screenTransform = useDerivedValue<ScreenTransform>(() => {
		if (!hasAnyPair()) {
			if (lastScreenTransform.get() !== IDENTITY_SCREEN_TRANSFORM)
				lastScreenTransform.set(IDENTITY_SCREEN_TRANSFORM);
			return IDENTITY_SCREEN_TRANSFORM;
		}
		const screen = screenInterpolatorProps.get().layouts.screen;
		const layers = localStylesMaps.get();
		let contentStyle: StyleProps | undefined;
		for (let index = 0; index < layers.length; index++) {
			const style = layers[index]?.content?.style;
			if (style?.transform !== undefined) contentStyle = style;
		}
		let next = readScreenTransform(contentStyle, screen.width, screen.height);
		for (let index = 0; index < ancestorTransforms.length; index++) {
			const outer = ancestorTransforms[index]?.get();
			if (outer) next = composeScreenTransforms(outer, next);
		}
		const previous = lastScreenTransform.get();
		if (areScreenTransformsEqual(previous, next)) return previous;
		lastScreenTransform.set(next);
		return next;
	});
	const scroll = ScrollStore.getValue(currentScreenKey, "metadata");
	useLayoutEffect(() => {
		if (!owner) return;
		scheduleOnUI(registerScreenTransform, currentScreenKey, screenTransform);
		scheduleOnUI(registerScreenScroll, currentScreenKey, scroll);
		return () => {
			scheduleOnUI(
				unregisterScreenTransform,
				currentScreenKey,
				screenTransform,
			);
			scheduleOnUI(unregisterScreenScroll, currentScreenKey, scroll);
		};
	}, [owner, currentScreenKey, screenTransform, scroll]);

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
		if (!hasAnyPair()) return NO_SCREEN_TRANSFORMS;
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
	const pairPresentation = usePairPresentation(
		pipeline,
		interpolatorRuns,
		screenTransforms,
	);

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

	// One coordinator per screen measures its boundaries.
	useBoundaryMeasureCoordinator(owner, contentMeasureRef, slotsMap);

	return {
		boundsAccessor,
		pairPresentation,
		slotsMap,
		screenTransform,
		contentMeasureRef,
		idleBoundaryPresentation,
		interpolatorRuns,
	};
}
