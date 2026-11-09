import {
	useCallback,
	useLayoutEffect,
	useRef,
	useSyncExternalStore,
} from "react";
import {
	type DerivedValue,
	type MeasuredDimensions,
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import { useBuilderStore } from "../../../providers/builder";
import { useMotionStore } from "../../../providers/motion";
import { updateDerivations } from "../../../providers/orchestrator/helpers/derivations";
import type {
	ScreenAnimationPipeline,
	ScreenInterpolatorFrame,
} from "../../../providers/orchestrator/helpers/pipeline";
import { useOptionalOrchestratorStore } from "../../../providers/orchestrator/orchestrator.provider";
import { createInterpolatorScope } from "../../../providers/orchestrator/styles/helpers/create-interpolator-scope";
import { normalizeSlots } from "../../../providers/orchestrator/styles/helpers/normalize-slots";
import { selectInterpolatorFrame } from "../../../providers/orchestrator/styles/helpers/select-interpolator-frame";
import { stripInterpolatorOptions } from "../../../providers/orchestrator/styles/helpers/strip-interpolator-options";
import type { InterpolatorRuns } from "../../../providers/orchestrator/styles/hooks/use-interpolated-style-maps";
import type { ScreenPairKey } from "../../../stores/bounds";
import {
	getDestinationScreenKeyFromPairKey,
	getScreenTransform,
	getSourceScreenKeyFromPairKey,
	pairs,
} from "../../../stores/bounds";
import type {
	NormalizedTransitionInterpolatedStyle,
	ScreenStyleInterpolator,
} from "../../../types/animation.types";
import type { ScreenTransform } from "../../../utils/bounds/helpers/screen-transform";
import {
	boundingBox,
	IDENTITY_SCREEN_TRANSFORM,
	toAffine,
	toLayoutSpace,
} from "../../../utils/bounds/helpers/screen-transform";
import {
	applyBoundsScreenFrames,
	screenCoverage,
} from "../../../utils/bounds/helpers/styles/apply-screen-frames";
import { isHandoffLanded } from "../../../utils/bounds/helpers/styles/overlap";
import { isTeleportAvailable } from "../portal/teleport";

export type BoundaryPairPresentation = {
	pairKey: string;
	sourceKey: string;
	destinationKey: string;
	ready: boolean;
	/** The destination is closing: a newer screen pushed over its source is on top of it. */
	closing: boolean;
	/** Closing, and its handoff content has landed in its source slot (see isHandoffLanded). */
	landed: boolean;
	source: NormalizedTransitionInterpolatedStyle;
	destination: NormalizedTransitionInterpolatedStyle;
};

export function boundarySourceFrame(
	frame: ScreenInterpolatorFrame,
): ScreenInterpolatorFrame | undefined {
	"worklet";
	if (!frame.previous) return undefined;
	const source = {
		...frame,
		previous: undefined,
		current: frame.previous,
		next: frame.current,
		layouts: frame.previous.layouts,
	};
	updateDerivations(source);
	return source;
}

export function runBoundaryInterpolator(
	interpolator: ScreenStyleInterpolator,
	frame: ScreenInterpolatorFrame,
	side: "source" | "destination",
) {
	"worklet";
	const raw = interpolator(
		createInterpolatorScope({
			frame,
			selectedFrame: selectInterpolatorFrame(frame, side === "destination"),
		}),
	);
	return raw && typeof raw === "object"
		? normalizeSlots(stripInterpolatorOptions(raw))
		: NO_STYLES;
}

type PairLinks = NonNullable<
	ReturnType<typeof pairs.get>[ScreenPairKey]
>["links"];

/**
 * The pair this screen is the destination of. Within a stack it is the previous route's; across
 * stacks (a card in a nested stack opening a screen on the root) the source is a screen of another
 * stack, so the pair is found by its destination in the bounds store.
 */
const resolveIncomingPair = (
	stackPairKey: ScreenPairKey | undefined,
	destinationKey: string,
): { pairKey: ScreenPairKey; links: PairLinks } | null => {
	"worklet";
	const all = pairs.get();
	if (stackPairKey && all[stackPairKey]?.links)
		return { pairKey: stackPairKey, links: all[stackPairKey].links };
	for (const key in all) {
		const pairKey = key as ScreenPairKey;
		if (getDestinationScreenKeyFromPairKey(pairKey) !== destinationKey)
			continue;
		const links = all[pairKey]?.links;
		if (links) return { pairKey, links };
	}
	return null;
};

// Screens that are a pair's destination, wherever they are in the route tree: a boundary following
// its pairs reads their presentations as well as its own stack's (a pair can cross stacks).
const pairDestinationListeners = new Set<() => void>();
let pairDestinationKeys: readonly string[] = [];
const setPairDestination = (key: string, present: boolean) => {
	const has = pairDestinationKeys.includes(key);
	if (has === present) return;
	pairDestinationKeys = present
		? [...pairDestinationKeys, key]
		: pairDestinationKeys.filter((k) => k !== key);
	for (const listener of pairDestinationListeners) listener();
};
const subscribePairDestinations = (listener: () => void) => {
	pairDestinationListeners.add(listener);
	return () => {
		pairDestinationListeners.delete(listener);
	};
};
const EMPTY_KEYS: readonly string[] = [];
/** Pair destinations outside `known` (a boundary's own stack); stable while those don't change. */
export const usePairDestinationKeys = (known: readonly string[]) => {
	const cache = useRef<readonly string[]>(EMPTY_KEYS);
	const getSnapshot = useCallback(() => {
		const next = pairDestinationKeys.filter((key) => !known.includes(key));
		const prev = cache.current;
		if (next.length === prev.length && next.every((key, i) => key === prev[i]))
			return prev;
		cache.current = next.length ? next : EMPTY_KEYS;
		return cache.current;
	}, [known]);
	return useSyncExternalStore(subscribePairDestinations, getSnapshot);
};

const NO_TRANSFORMS: Record<string, ScreenTransform | undefined> = {};

/** More of a handoff element's home than this covered by its closing destination: it hides it. */
const HOME_COVERED = 0.25;

/**
 * Whether the closing destination still hides a handoff element's home (its source slot, where its
 * source screen draws it). Its content goes home only once it doesn't: a closing screen that stays
 * where it is until it is gone (no motion of its own) would hide it there. One shrunk to a speck
 * over it, or moved off it, doesn't.
 */
const coversHandoffHomes = (
	links: PairLinks,
	destinationKey: string,
	transforms: Record<string, ScreenTransform | undefined>,
) => {
	"worklet";
	const read = (key: string) =>
		transforms[key] ?? getScreenTransform(key) ?? IDENTITY_SCREEN_TRANSFORM;
	const screen = read(destinationKey);
	for (const key in links) {
		const link = links[key];
		if (!link?.destination?.handoff || !link.source) continue;
		const from = link.source.bounds as MeasuredDimensions & {
			screenTransform?: ScreenTransform;
		};
		const home = boundingBox(
			toLayoutSpace(from, from.screenTransform),
			toAffine(read(link.source.screenKey)),
		);
		if (screenCoverage(screen, home) > HOME_COVERED) return true;
	}
	return false;
};

// Each destination owns the output of its incoming pair, even when its source
// has moved on to another route. All boundaries read this same UI value.
//
// Both sides are this screen's interpolator: on its current-only frame (the destination) and on its
// previous screen's frame (the source). The screens already run exactly those every frame for their
// own styles when they own the relationship, so those runs are read; the interpolator runs again
// here only when a screen's run was on a different frame (see InterpolatorRuns).
export function usePairPresentation(
	{ screenInterpolatorProps, currentInterpolator }: ScreenAnimationPipeline,
	/** This screen's interpolator runs. */
	interpolatorRuns?: SharedValue<InterpolatorRuns>,
	/** The stack's screen transforms by key (others are read by key; see applyBoundsScreenFrames). */
	screenTransforms?: SharedValue<Record<string, ScreenTransform | undefined>>,
): DerivedValue<BoundaryPairPresentation | undefined> {
	const stackPairKey = useBuilderStore((s) => s.derivations.destinationPairKey);
	const currentScreenKey = useBuilderStore(
		(s) => s.derivations.currentScreenKey,
	);
	const previousScreenKey = useBuilderStore(
		(s) => s.derivations.previousScreenKey,
	);
	const previousRuns: DerivedValue<InterpolatorRuns> | null =
		useOptionalOrchestratorStore(
			previousScreenKey ?? null,
			(s) => s.interpolatorRuns,
		);
	const ready = useMotionStore((s) => s.isScreenReady);
	const isPairDestination = !!stackPairKey && !!currentInterpolator;
	useLayoutEffect(() => {
		if (!isPairDestination) return;
		setPairDestination(currentScreenKey, true);
		return () => setPairDestination(currentScreenKey, false);
	}, [isPairDestination, currentScreenKey]);
	return useDerivedValue(() => {
		if (!stackPairKey || !currentInterpolator) return undefined;
		const incoming = resolveIncomingPair(stackPairKey, currentScreenKey);
		if (!incoming) return undefined;
		const { pairKey, links } = incoming;
		// Only escaped boundaries (with Teleport) draw from pair presentations.
		if (!isTeleportAvailable) return undefined;
		let linked = false;
		for (const key in links) {
			const { source, destination } = links[key];
			if (source || destination?.handoff) {
				linked = true;
				break;
			}
		}
		if (!linked) return undefined;
		const frame = screenInterpolatorProps.get();
		const previous = frame.previous;
		if (!previous) return undefined;
		const destinationKey = frame.current.route.key;
		const own = interpolatorRuns?.get();
		const destination =
			own?.current && own.currentOnly && own.screenKey === destinationKey
				? own.current.stylesMap
				: runBoundaryInterpolator(currentInterpolator, frame, "destination");
		const sourceRuns = previousRuns?.get();
		const source =
			sourceRuns?.next &&
			sourceRuns.nextExact &&
			sourceRuns.screenKey === previous.route.key &&
			sourceRuns.nextKey === destinationKey
				? sourceRuns.next.stylesMap
				: runBoundaryInterpolator(
						currentInterpolator,
						boundarySourceFrame(frame) as ScreenInterpolatorFrame,
						"source",
					);
		return {
			pairKey,
			// The pair's own source: across stacks, a screen of another stack (not this stack's
			// previous route, whose frame still runs the source side of the interpolator).
			sourceKey: getSourceScreenKeyFromPairKey(pairKey),
			destinationKey,
			ready: ready.get(),
			closing: !!frame.current.closing,
			landed:
				!!frame.current.closing &&
				isHandoffLanded(links, frame.current.progress) &&
				!coversHandoffHomes(
					links,
					destinationKey,
					screenTransforms?.get() ?? NO_TRANSFORMS,
				),
			// Both sides as their screens draw them this frame (see applyBoundsScreenFrames).
			source: applyBoundsScreenFrames(
				source,
				screenTransforms?.get() ?? NO_TRANSFORMS,
			),
			destination: applyBoundsScreenFrames(
				destination,
				screenTransforms?.get() ?? NO_TRANSFORMS,
			),
		} satisfies BoundaryPairPresentation;
	});
}
