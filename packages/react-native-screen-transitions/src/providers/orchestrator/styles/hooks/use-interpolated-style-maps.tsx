import {
	useAnimatedReaction,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import type {
	NormalizedTransitionInterpolatedStyle,
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useBuilderStore } from "../../../builder";
import {
	hasCloseTransitionFinished,
	isOpenTransitionBlocked,
} from "../../../motion/helpers/transition-visual-state";
import { resolveInitialDestinationStyleGate } from "../../../motion/helpers/visibility-gate";
import { LifecycleTransitionRequestKind } from "../../../motion/hooks/use-transition-values";
import {
	useMotionStore,
	useOptionalMotionStore,
} from "../../../motion/motion.store";
import { syncScreenOptionsOverrides } from "../../../motion/options";
import type {
	ScreenAnimationPipeline,
	ScreenInterpolatorFrame,
} from "../../helpers/pipeline";
import { syncSelectedInterpolatorOptions } from "../../helpers/selected-interpolator-options";
import { createInterpolatorScope } from "../helpers/create-interpolator-scope";
import { normalizeSlots } from "../helpers/normalize-slots";
import { resolveInterpolatorStyleHandoff } from "../helpers/resolve-interpolator-style-handoff";
import type { LocalStyleLayers } from "../helpers/resolve-slot-styles";
import {
	type SelectedInterpolatorFrame,
	selectInterpolatorFrame,
	selectNextInterpolatorFrame,
} from "../helpers/select-interpolator-frame";
import { stripInterpolatorOptions } from "../helpers/strip-interpolator-options";

const NO_STYLE_LAYERS: LocalStyleLayers = [];

type InterpolatorResult = {
	stylesMap: NormalizedTransitionInterpolatedStyle;
	rawStyleMap: TransitionInterpolatedStyle | undefined;
};

/**
 * What this screen's interpolators produced this frame, before layering. Other screens read it: a
 * pair's presentation needs the destination's interpolator on the destination's current-only frame
 * and on the source's frame, which these runs already are (see usePairPresentation).
 */
export type InterpolatorRuns = {
	/** The screen these runs styled. */
	screenKey: string;
	/** Its own interpolator; `currentOnly` when it ran on the current-only frame. */
	current: InterpolatorResult | undefined;
	currentOnly: boolean;
	/** The next screen's interpolator on this screen, when it ran; `nextExact` when on this screen's plain frame. */
	next: InterpolatorResult | undefined;
	nextKey: string | undefined;
	nextExact: boolean;
	/** The destination's first styles are held back until it is ready. */
	withheld: boolean;
	currentOwnsInterpolator: boolean;
	interpolatorOptionsOwner: "current" | "next";
	currentClosing: boolean;
};

type RunInterpolatorParams = {
	interpolator: ScreenStyleInterpolator | undefined;
	props: ScreenInterpolatorFrame;
	selectedFrame: SelectedInterpolatorFrame;
};

const normalizeRawStyleMap = (
	rawStyleMap: TransitionInterpolatedStyle | undefined,
) => {
	"worklet";

	if (!rawStyleMap) {
		return NO_STYLES;
	}

	const stylesMap = normalizeSlots(stripInterpolatorOptions(rawStyleMap));

	return stylesMap;
};

const runInterpolator = ({
	interpolator,
	props,
	selectedFrame,
}: RunInterpolatorParams): InterpolatorResult | undefined => {
	"worklet";

	if (!interpolator) {
		return undefined;
	}

	try {
		const raw = interpolator(
			createInterpolatorScope({
				frame: props,
				selectedFrame,
			}),
		);

		const rawStyleMap: TransitionInterpolatedStyle | undefined =
			typeof raw === "object" && raw != null ? raw : undefined;

		return {
			rawStyleMap,
			stylesMap: normalizeRawStyleMap(rawStyleMap),
		};
	} catch (_) {
		if (__DEV__) {
			logger.warn("screenStyleInterpolator must be a worklet");
		}

		return undefined;
	}
};

/**
 * Builds the raw interpolated style layers for the current screen pass.
 *
 * This hook exists to stabilize style ownership during rapid navigation,
 * especially when an interactive close gesture overlaps with a new navigation
 * event. In flows like `A -> B`, begin closing `B`, then quickly open `C`,
 * the active route state can change before the gesture-driven close has
 * visually finished.
 *
 * If we immediately switch to the next interpolator in that window, styles can
 * be computed against the wrong route pair and leave layer or element slots
 * stranded in an intermediate state. We therefore latch onto the current
 * gesture interpolator for the lifetime of that close interaction, then resume
 * normal interpolator selection once the gesture-driven close is no longer in
 * play.
 *
 * At an ownership handoff, the current interpolator remains live but is
 * evaluated without the next-screen relationship. The next owner replaces
 * matching scalar keys and composes its live transforms after the current
 * screen's self-owned transforms.
 */
export const useInterpolatedStylesMap = ({
	pipeline,
}: {
	pipeline: ScreenAnimationPipeline;
}) => {
	const isScreenReady = useMotionStore((store) => store.isScreenReady);
	const nextScreenKey = useBuilderStore((s) => s.derivations.nextScreenKey);
	// A screen still closing above this one (a push landed during its close) keeps covering it until
	// the new screen's open starts, so the next interpolator keeps this screen's style meanwhile.
	const hasClosingNext = useBuilderStore((s) => !!s.descriptors.closingNext);
	const destinationPairKey = useBuilderStore(
		(s) => s.derivations.destinationPairKey,
	);
	const screenOptions = useMotionStore((store) => store.options);
	const {
		screenInterpolatorProps,
		selectedInterpolatorOptions,
		nextInterpolator,
		currentInterpolator,
	} = pipeline;

	const currentSystem = useMotionStore((store) => store.state);
	const nextSystem = useOptionalMotionStore(
		nextScreenKey ?? null,
		(store) => store.state,
	);

	const hasNextSystem = !!nextSystem;
	const { closing: activeClosing, entering: activeEntering } =
		nextSystem ?? currentSystem;

	const {
		animationProgress: activeAnimationProgress,
		pendingLifecycleRequestKind: activePendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount: activePendingLifecycleStartBlockCount,
	} = nextSystem ?? currentSystem;

	const isGesturingDuringCloseAnimation = useSharedValue(false);
	const initialDestinationStylesReady = useSharedValue(0);
	const shouldPrepareInitialDestinationStyles =
		!!destinationPairKey && !nextScreenKey && !!currentInterpolator;

	useAnimatedReaction(
		() => {
			"worklet";
			return isScreenReady.get();
		},
		(isScreenReady) => {
			"worklet";
			const styleGate = resolveInitialDestinationStyleGate({
				shouldPrepareStyles: shouldPrepareInitialDestinationStyles,
				isScreenReady,
				stylesReady: !!initialDestinationStylesReady.get(),
			});

			if (styleGate.shouldMarkStylesReady) {
				initialDestinationStylesReady.set(1);
			}
		},
	);

	const interpolatorRuns = useDerivedValue<InterpolatorRuns>(() => {
		const props = screenInterpolatorProps.get();

		const { current, next } = props;
		const isDragging = current.gesture.dragging;
		const isNextClosing = !!next?.closing;

		// Keep using the gesture-driven interpolator until the closing gesture has
		// fully released. This avoids switching style ownership mid-flight when a
		// new navigation event lands before the close interaction visually settles.
		if (isDragging && isNextClosing) {
			isGesturingDuringCloseAnimation.set(true);
		}

		if (!isDragging && !isNextClosing) {
			isGesturingDuringCloseAnimation.set(false);
		}

		const isInGestureMode =
			!!isDragging || isGesturingDuringCloseAnimation.get();

		// Interpolator ownership changes only at visual boundaries on the UI thread:
		// the next screen attaches after its blockers clear and progress starts, then
		// detaches once its closing progress has committed at zero. The downstream
		// resolver sees the owner disappear in this same graph and resets its styles
		// without waiting for React to remove the screen.
		const isPendingOpen =
			activePendingLifecycleRequestKind.get() ===
			LifecycleTransitionRequestKind.Open;
		const activeOpening = isPendingOpen || !!activeEntering.get();
		const isOpeningBlocked = isOpenTransitionBlocked({
			opening: activeOpening,
			pendingLifecycleStartBlockCount:
				activePendingLifecycleStartBlockCount.get(),
			animationProgress: activeAnimationProgress.get(),
		});
		const hasCloseFinished = hasCloseTransitionFinished({
			closing: activeClosing.get(),
			animationProgress: activeAnimationProgress.get(),
		});
		// Dragging this screen while the screen above it still closes (a fast swipe back through a
		// chain): this screen follows its own drag (its interpolator on the current-only frame) and the
		// closing screen keeps uncovering it (its interpolator composed on top). Either one alone jumps:
		// dropping the cover snaps this screen out from under it, keeping only the cover ignores the drag.
		const composesClosingNext =
			isInGestureMode &&
			isNextClosing &&
			!!nextInterpolator &&
			hasNextSystem &&
			!hasCloseFinished;
		const currentOwnsInterpolator =
			(isInGestureMode && !composesClosingNext) ||
			!nextInterpolator ||
			!hasNextSystem ||
			(isOpeningBlocked && !hasClosingNext) ||
			hasCloseFinished;
		// The dragged screen keeps its own gesture options while a closing screen above is composed in.
		const interpolatorOptionsOwner =
			currentOwnsInterpolator || composesClosingNext ? "current" : "next";

		// Once the next interpolator owns the relationship, the current
		// interpolator remains responsible only for its own live presentation.
		// This preserves snap-point transforms without letting current-screen
		// unfocus rules compete with the next screen's outgoing transition.
		const currentSelectedFrame = selectInterpolatorFrame(
			props,
			isInGestureMode || !!nextInterpolator,
		);
		const currentResult = runInterpolator({
			interpolator: currentInterpolator,
			props,
			selectedFrame: currentSelectedFrame,
		});

		const initialDestinationStyleGate = resolveInitialDestinationStyleGate({
			shouldPrepareStyles: shouldPrepareInitialDestinationStyles,
			isScreenReady: isScreenReady.get(),
			stylesReady: !!initialDestinationStylesReady.get(),
			startBlocked: activePendingLifecycleStartBlockCount.get() > 0,
		});
		const runs: InterpolatorRuns = {
			screenKey: current.route.key,
			current: currentResult,
			currentOnly: isInGestureMode || !!nextInterpolator || !next,
			next: undefined,
			nextKey: next?.route.key,
			nextExact: false,
			withheld: initialDestinationStyleGate.shouldWithholdStyles,
			currentOwnsInterpolator,
			interpolatorOptionsOwner,
			currentClosing: !!current.closing && isNextClosing,
		};
		if (runs.withheld || currentOwnsInterpolator) {
			return runs;
		}

		const composedWithCurrent = !!currentResult?.stylesMap;
		runs.next = runInterpolator({
			interpolator: nextInterpolator,
			props,
			selectedFrame: selectNextInterpolatorFrame(props, composedWithCurrent),
		});
		// The composed frame sees this screen as fully open; a screen that is fully open is unaffected.
		runs.nextExact =
			!composedWithCurrent ||
			(current.progress === 1 && current.transitionProgress === 1);
		return runs;
	});

	const localStylesMaps = useDerivedValue<LocalStyleLayers>(() => {
		const runs = interpolatorRuns.get();
		if (runs.withheld) {
			return NO_STYLE_LAYERS;
		}
		const currentResult = runs.current;

		if (runs.currentOwnsInterpolator) {
			syncSelectedInterpolatorOptions(
				selectedInterpolatorOptions,
				"current",
				currentResult?.rawStyleMap?.options,
			);
			syncScreenOptionsOverrides(currentResult?.rawStyleMap, screenOptions);

			const handoff = resolveInterpolatorStyleHandoff({
				currentOwnsInterpolator: true,
				currentStylesMap: currentResult?.stylesMap,
				nextStylesMap: undefined,
			});

			return handoff.localStylesMaps.length
				? handoff.localStylesMaps
				: NO_STYLE_LAYERS;
		}

		const nextResult = runs.next;
		if (runs.interpolatorOptionsOwner === "current") {
			syncSelectedInterpolatorOptions(
				selectedInterpolatorOptions,
				"current",
				currentResult?.rawStyleMap?.options,
			);
			syncScreenOptionsOverrides(currentResult?.rawStyleMap, screenOptions);
		} else {
			syncSelectedInterpolatorOptions(
				selectedInterpolatorOptions,
				"next",
				nextResult?.rawStyleMap?.options,
			);
			syncScreenOptionsOverrides(undefined, screenOptions);
		}

		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: currentResult?.stylesMap,
			nextStylesMap: nextResult?.stylesMap,
			currentClosing: runs.currentClosing,
		});

		return handoff.localStylesMaps.length
			? handoff.localStylesMaps
			: NO_STYLE_LAYERS;
	});

	return { localStylesMaps, interpolatorRuns };
};
