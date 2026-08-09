import { useMemo } from "react";
import {
	type SharedValue,
	useAnimatedReaction,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../../stores/system.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { logger } from "../../../../utils/logger";
import { useScreenAnimationStore } from "../../animation";
import { useBuildTransitionAccessor } from "../../animation/helpers/accessors/use-build-transition-accessor";
import type { ScreenInterpolatorFrame } from "../../animation/helpers/pipeline";
import { readScreenAnimationRevisions } from "../../animation/helpers/read-screen-animation-revisions";
import { syncSelectedInterpolatorOptions } from "../../animation/helpers/selected-interpolator-options";
import { useDescriptorsStore } from "../../descriptors";
import {
	syncScreenOptionsOverrides,
	useScreenOptionsStore,
} from "../../options";
import { collectInterpolatorSharedValues } from "../helpers/collect-interpolator-shared-values";
import { createInterpolatorScope } from "../helpers/create-interpolator-scope";
import { normalizeSlots } from "../helpers/normalize-slots";
import { resolveInterpolatorStyleHandoff } from "../helpers/resolve-interpolator-style-handoff";
import type { LocalStyleLayers } from "../helpers/resolve-slot-styles";
import {
	type SelectedInterpolatorFrame,
	selectInterpolatorFrame,
} from "../helpers/select-interpolator-frame";
import { stripInterpolatorOptions } from "../helpers/strip-interpolator-options";
import {
	hasCloseTransitionFinished,
	isOpenTransitionBlocked,
	isScreenInterpolatorReady,
} from "../helpers/transition-visual-state";
import { resolveInitialDestinationStyleGate } from "../helpers/visibility-gate";

const NO_STYLE_LAYERS: LocalStyleLayers = [];

type InterpolatorResult = {
	stylesMap: NormalizedTransitionInterpolatedStyle;
	rawStyleMap: TransitionInterpolatedStyle | undefined;
};

type RunInterpolatorParams = {
	interpolator: ScreenStyleInterpolator | undefined;
	props: ScreenInterpolatorFrame;
	selectedFrame: SelectedInterpolatorFrame;
	transition: Parameters<ScreenStyleInterpolator>[0]["transition"];
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
	transition,
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
				transition,
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
	enabled,
	visibilityBlocked,
}: {
	enabled: boolean;
	visibilityBlocked: SharedValue<boolean>;
}) => {
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const destinationPairKey = useDescriptorsStore(
		(s) => s.derivations.destinationPairKey,
	);
	const screenOptions = useScreenOptionsStore();
	const screenInterpolatorProps = useScreenAnimationStore(
		(store) => store.screenInterpolatorProps,
	);
	const screenInterpolatorPropsRevision = useScreenAnimationStore(
		(store) => store.screenInterpolatorPropsRevision,
	);
	const selectedInterpolatorOptions = useScreenAnimationStore(
		(store) => store.selectedInterpolatorOptions,
	);
	const nextInterpolator = useScreenAnimationStore(
		(store) => store.nextInterpolator,
	);
	const currentInterpolator = useScreenAnimationStore(
		(store) => store.currentInterpolator,
	);
	const ancestorScreenAnimationSources = useScreenAnimationStore(
		(store) => store.ancestorScreenAnimationSources,
	);
	const descendantScreenAnimationSources = useScreenAnimationStore(
		(store) => store.descendantScreenAnimationSources,
	);
	const transition = useBuildTransitionAccessor({
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		ancestorScreenAnimationSources,
		descendantScreenAnimationSources,
	});
	const hasCurrentInterpolator = !!currentInterpolator;
	const { closing: currentClosing, entering: currentEntering } =
		AnimationStore.getBag(currentScreenKey);
	const {
		animationProgress: currentAnimationProgress,
		pendingLifecycleRequestKind: currentPendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount: currentPendingLifecycleStartBlockCount,
	} = SystemStore.getBag(currentScreenKey);
	const interpolatorReady = useDerivedValue<number>(() => {
		"worklet";
		const isPendingOpen =
			currentPendingLifecycleRequestKind.get() ===
			LifecycleTransitionRequestKind.Open;
		const opening = isPendingOpen || !!currentEntering.get();

		return isScreenInterpolatorReady({
			hasInterpolator: hasCurrentInterpolator,
			opening,
			closing: currentClosing.get(),
			pendingLifecycleStartBlockCount:
				currentPendingLifecycleStartBlockCount.get(),
			animationProgress: currentAnimationProgress.get(),
		})
			? 1
			: 0;
	});

	// In some cases, a user may want to use external shared values to drive animations in the interpoaltor.
	// We can now support this by collecting those shared values and reading them here to trigger an update.
	const interpolatorSharedValues = useMemo(
		() =>
			collectInterpolatorSharedValues([currentInterpolator, nextInterpolator]),
		[currentInterpolator, nextInterpolator],
	);

	const activeScreenKey = nextScreenKey ?? currentScreenKey;
	const { closing: activeClosing, entering: activeEntering } =
		AnimationStore.getBag(activeScreenKey);
	const {
		animationProgress: activeAnimationProgress,
		pendingLifecycleRequestKind: activePendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount: activePendingLifecycleStartBlockCount,
	} = SystemStore.getBag(activeScreenKey);

	const isGesturingDuringCloseAnimation = useSharedValue(false);
	const initialDestinationStylesReady = useSharedValue(0);
	const shouldPrepareInitialDestinationStyles =
		enabled && !!destinationPairKey && !nextScreenKey && !!currentInterpolator;

	useAnimatedReaction(
		() => {
			"worklet";
			return visibilityBlocked.get();
		},
		(isVisibilityBlocked) => {
			"worklet";
			const styleGate = resolveInitialDestinationStyleGate({
				shouldPrepareStyles: shouldPrepareInitialDestinationStyles,
				isVisibilityBlocked,
				stylesReady: !!initialDestinationStylesReady.get(),
			});

			if (styleGate.shouldMarkStylesReady) {
				initialDestinationStylesReady.set(1);
			}
		},
	);

	const localStylesMaps = useDerivedValue<LocalStyleLayers>(() => {
		"worklet";
		readScreenAnimationRevisions(
			screenInterpolatorPropsRevision,
			ancestorScreenAnimationSources,
			descendantScreenAnimationSources,
			interpolatorSharedValues,
		);
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
		const currentOwnsInterpolator =
			isInGestureMode ||
			!nextInterpolator ||
			isOpeningBlocked ||
			hasCloseFinished;
		const interpolatorOptionsOwner = currentOwnsInterpolator
			? "current"
			: "next";

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
			transition,
		});

		const initialDestinationStyleGate = resolveInitialDestinationStyleGate({
			shouldPrepareStyles: shouldPrepareInitialDestinationStyles,
			isVisibilityBlocked: visibilityBlocked.get(),
			stylesReady: !!initialDestinationStylesReady.get(),
		});

		if (initialDestinationStyleGate.shouldWithholdStyles) {
			return NO_STYLE_LAYERS;
		}

		if (interpolatorOptionsOwner === "current") {
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

		const nextSelectedFrame = selectInterpolatorFrame(props, false);
		const nextResult = runInterpolator({
			interpolator: nextInterpolator,
			props,
			selectedFrame: nextSelectedFrame,
			transition,
		});

		syncSelectedInterpolatorOptions(
			selectedInterpolatorOptions,
			"next",
			nextResult?.rawStyleMap?.options,
		);
		syncScreenOptionsOverrides(undefined, screenOptions);

		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: currentResult?.stylesMap,
			nextStylesMap: nextResult?.stylesMap,
		});

		return handoff.localStylesMaps.length
			? handoff.localStylesMaps
			: NO_STYLE_LAYERS;
	});

	return {
		interpolatorReady,
		localStylesMaps,
	};
};
