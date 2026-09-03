import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import {
	runOnJS,
	runOnUI,
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import {
	type CanonicalSmoothClipPresentation,
	canonicalizeClipPresentation,
	type SmoothClipCompletion,
	type SmoothClipController,
	type SmoothClipPresentation,
	type SmoothClipRef,
	useSmoothClipGroup,
} from "react-native-smooth-clip-view";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../types/animation.types";
import { logger } from "../../../utils/logger";
import { useScreenAnimationContext } from "../animation";
import {
	globalSmoothClipCoordinatorRuntime,
	type SmoothClipPhysicalRootKind,
	type TrustedSmoothClipNativePlan,
} from "../clips/coordinator/runtime-store";
import { useDescriptorDerivations } from "../descriptors";
import {
	type ClipStreamUIRegistration,
	registerClipStreamRootOnUI,
	unregisterClipStreamRootOnUI,
	updateClipStreamRootRouteOnUI,
} from "./clip-stream-ui";
import {
	INITIAL_LEGACY_CLIP_RENDER_STATE,
	type LegacyClipRenderState,
	resolveLegacyClipRenderState,
	selectLegacySmoothClipPresentation,
} from "./legacy-clip-fallback";
import {
	type LegacyClipFootprint,
	type LegacyClipProjectionReason,
	resolveLegacyClipProjection,
} from "./legacy-clip-projector";

type ClipSlot = NormalizedTransitionSlotStyle & {
	clip?: SmoothClipPresentation | null;
};

type ClipStreamParticipant = {
	base: CanonicalSmoothClipPresentation;
	clip: SmoothClipRef;
	footprint?: LegacyClipFootprint;
	projection: "explicit" | "legacy";
	registrationId: number;
	renderState?: SharedValue<LegacyClipRenderState>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	streamingSuspended: SharedValue<number>;
	styleId: string;
	trustedPlanIds?: readonly string[];
};

type ClipStreamParticipantRegistration = ClipStreamParticipant & {
	runtimeController: SmoothClipController;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
};

type IgnoredClipSlot = {
	registrationId: number;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	styleId: string;
};

type ClipStreamContextValue = {
	registerIgnoredSlot(entry: IgnoredClipSlot): () => void;
	registerParticipant(entry: ClipStreamParticipantRegistration): () => void;
};

const ClipStreamContext = createContext<ClipStreamContextValue | null>(null);

let nextClipRegistrationId = 1;
let nextClipStreamRootId = 1;

const allocateClipRegistrationId = () => {
	const registrationId = nextClipRegistrationId;
	nextClipRegistrationId += 1;
	return registrationId;
};

const allocateClipStreamRootId = () => {
	const rootId = nextClipStreamRootId;
	nextClipStreamRootId += 1;
	return rootId;
};

const presentationEquals = (
	left: CanonicalSmoothClipPresentation,
	right: CanonicalSmoothClipPresentation,
) => {
	"worklet";
	return (
		left.clip.x === right.clip.x &&
		left.clip.y === right.clip.y &&
		left.clip.width === right.clip.width &&
		left.clip.height === right.clip.height &&
		left.clip.topLeftRadius === right.clip.topLeftRadius &&
		left.clip.topRightRadius === right.clip.topRightRadius &&
		left.clip.bottomRightRadius === right.clip.bottomRightRadius &&
		left.clip.bottomLeftRadius === right.clip.bottomLeftRadius &&
		left.clip.curve === right.clip.curve &&
		left.contentTranslateX === right.contentTranslateX &&
		left.contentTranslateY === right.contentTranslateY &&
		left.contentScale === right.contentScale &&
		left.boxShadow?.color === right.boxShadow?.color &&
		left.boxShadow?.offsetX === right.boxShadow?.offsetX &&
		left.boxShadow?.offsetY === right.boxShadow?.offsetY &&
		left.boxShadow?.blurRadius === right.boxShadow?.blurRadius &&
		left.boxShadow?.spreadDistance === right.boxShadow?.spreadDistance
	);
};

type PreparedClipBatch = {
	directGestureStreaming: boolean;
	entries: readonly {
		clip: SmoothClipRef;
		nextRenderState?: LegacyClipRenderState;
		frame: CanonicalSmoothClipPresentation;
		registrationId: number;
		renderState?: SharedValue<LegacyClipRenderState>;
	}[];
	ignoredStyleIds: readonly string[];
	invalidStyleId: string | null;
	legacyIssues: readonly LegacyClipIssue[];
	routeKey: string;
};

type LegacyClipIssue = Readonly<{
	detail?: string;
	reason: LegacyClipProjectionReason;
	styleId: string;
}>;

const preparedBatchEquals = (
	left: PreparedClipBatch | null,
	right: PreparedClipBatch,
) => {
	"worklet";
	if (left === null || left.invalidStyleId !== right.invalidStyleId) {
		return false;
	}
	if (
		left.directGestureStreaming !== right.directGestureStreaming ||
		left.entries.length !== right.entries.length ||
		left.ignoredStyleIds.length !== right.ignoredStyleIds.length ||
		left.legacyIssues.length !== right.legacyIssues.length ||
		left.routeKey !== right.routeKey
	) {
		return false;
	}
	for (let index = 0; index < right.entries.length; index += 1) {
		const previous = left.entries[index];
		const next = right.entries[index];
		if (
			previous === undefined ||
			next === undefined ||
			previous.registrationId !== next.registrationId ||
			previous.clip !== next.clip ||
			!presentationEquals(previous.frame, next.frame) ||
			previous.nextRenderState?.mode !== next.nextRenderState?.mode ||
			previous.nextRenderState?.overflowLatched !==
				next.nextRenderState?.overflowLatched
		) {
			return false;
		}
	}
	for (let index = 0; index < right.ignoredStyleIds.length; index += 1) {
		if (left.ignoredStyleIds[index] !== right.ignoredStyleIds[index]) {
			return false;
		}
	}
	for (let index = 0; index < right.legacyIssues.length; index += 1) {
		const previous = left.legacyIssues[index];
		const next = right.legacyIssues[index];
		if (
			previous === undefined ||
			next === undefined ||
			previous.styleId !== next.styleId ||
			previous.reason !== next.reason ||
			previous.detail !== next.detail
		) {
			return false;
		}
	}
	return true;
};

const warnIgnoredClipSlot = (styleId: string) => {
	if (styleId === "backdrop" || styleId === "surface") {
		logger.warnOnce(
			`clip:unsupported-slot:${styleId}`,
			`The clip channel for the reserved ${styleId} slot is ignored because that render layer is not an aperture parent.`,
		);
		return;
	}
	logger.warnOnce(
		`clip:unsupported-slot:${styleId}`,
		`The clip channel for "${styleId}" is ignored by Transition.View. Render Transition.ClipView for that styleId instead.`,
	);
};

const warnInvalidClipSlot = (styleId: string) => {
	logger.warnOnce(
		`clip:invalid-presentation:${styleId}`,
		`The clip channel for "${styleId}" contains a non-finite value or a non-positive contentScale. The atomic clip batch was not applied.`,
	);
};

const warnLegacyClipIssue = ({ detail, reason, styleId }: LegacyClipIssue) => {
	const detailSuffix = detail === undefined ? "" : ` (${detail})`;
	if (reason === "alpha-mask" || reason === "background-alpha-mask") {
		logger.warnOnce(
			`clip:legacy-alpha:${styleId}`,
			`Legacy mask "${styleId}" uses alpha-mask semantics${detailSuffix}. SmoothClip supports geometric masks only, so its content is rendered unclipped.`,
		);
		return;
	}
	logger.warnOnce(
		`clip:legacy-projection:${styleId}:${reason}:${detail ?? ""}`,
		`Legacy mask "${styleId}" could not be converted to SmoothClip geometry${detailSuffix}; RN overflow fallback is latched until this transition slot resets.`,
	);
};

type ClipStreamRootProps = {
	children: ReactNode;
	initialRouteKey: string;
	kind: SmoothClipPhysicalRootKind;
};

function ClipStreamRoot({
	children,
	initialRouteKey,
	kind,
}: ClipStreamRootProps) {
	const rootId = useRef(allocateClipStreamRootId()).current;
	const { screenInterpolatorProps, screenInterpolatorPropsRevision } =
		useScreenAnimationContext();
	const participants = useSharedValue<readonly ClipStreamParticipant[]>([]);
	const ignoredSlots = useSharedValue<readonly IgnoredClipSlot[]>([]);
	const participantsRef = useRef(new Map<number, ClipStreamParticipant>());
	const ignoredSlotsRef = useRef(new Map<number, IgnoredClipSlot>());
	const onNativeAnimationComplete = useCallback(
		(result: SmoothClipCompletion) => {
			globalSmoothClipCoordinatorRuntime.handleNativeCompletion(rootId, result);
		},
		[rootId],
	);
	const group = useSmoothClipGroup({
		onAnimationComplete: onNativeAnimationComplete,
	});
	const setFrames = group.ui.setFrames;
	const shouldWarn = __DEV__;
	const nativePromotionEnabled = globalSmoothClipCoordinatorRuntime.isEnabled();

	useLayoutEffect(() => {
		const unregisterRuntimeRoot =
			globalSmoothClipCoordinatorRuntime.registerRoot({
				group,
				kind,
				rootId,
				routeKey: initialRouteKey,
			});
		runOnUI(registerClipStreamRootOnUI)({
			participants: participants as unknown as SharedValue<
				readonly ClipStreamUIRegistration[]
			>,
			rootId,
			routeKey: initialRouteKey,
			setFrames,
		});
		return () => {
			runOnUI(unregisterClipStreamRootOnUI)(rootId);
			unregisterRuntimeRoot();
		};
	}, [group, initialRouteKey, kind, participants, rootId, setFrames]);

	const moveRuntimeRoot = useCallback(
		(routeKey: string) => {
			globalSmoothClipCoordinatorRuntime.moveRoot(rootId, routeKey);
		},
		[rootId],
	);

	useAnimatedReaction(
		() => {
			screenInterpolatorPropsRevision.get();
			const interpolatorProps = screenInterpolatorProps.get();
			const routeKey = interpolatorProps.active.route.key;
			const currentParticipants = participants.get();
			const entries: PreparedClipBatch["entries"][number][] = [];
			let invalidStyleId: string | null = null;
			const legacyIssues: LegacyClipIssue[] = [];

			for (let index = 0; index < currentParticipants.length; index += 1) {
				const participant = currentParticipants[index];
				if (participant === undefined) continue;
				const resolvedSlots = participant.slotsMap.get();
				const slot = resolvedSlots[participant.styleId] as ClipSlot | undefined;
				let requested: SmoothClipPresentation = participant.base;
				let nextRenderState: LegacyClipRenderState | undefined;
				if (participant.projection === "legacy") {
					const projected = resolveLegacyClipProjection({
						clip: slot?.clip,
						footprint: participant.footprint ?? {
							height: 0,
							width: 0,
						},
						style: slot?.style as Readonly<Record<string, unknown>> | undefined,
					});
					const currentRenderState =
						participant.renderState?.get() ?? INITIAL_LEGACY_CLIP_RENDER_STATE;
					nextRenderState = resolveLegacyClipRenderState({
						current: currentRenderState,
						projection: projected,
						slotPresent: slot !== undefined,
					});
					if (
						projected.kind === "fallback" &&
						projected.reason === "invalid-explicit-clip"
					) {
						invalidStyleId = participant.styleId;
						break;
					}
					requested = selectLegacySmoothClipPresentation(
						participant.base,
						projected,
						nextRenderState,
					);
					if (projected.kind === "fallback" || projected.kind === "unclipped") {
						legacyIssues.push({
							detail: projected.detail,
							reason: projected.reason,
							styleId: participant.styleId,
						});
					}
				} else {
					requested = slot?.clip ?? participant.base;
				}
				const presentation = canonicalizeClipPresentation(requested);
				if (presentation === null) {
					invalidStyleId = participant.styleId;
					break;
				}
				const nativeAnimationActive =
					nativePromotionEnabled && participant.streamingSuspended.get() !== 0;
				if (!nativeAnimationActive) {
					entries.push({
						clip: participant.clip,
						nextRenderState,
						frame: presentation,
						registrationId: participant.registrationId,
						renderState: participant.renderState,
					});
				}
			}

			const ignoredStyleIds: string[] = [];
			if (shouldWarn) {
				const currentIgnoredSlots = ignoredSlots.get();
				for (let index = 0; index < currentIgnoredSlots.length; index += 1) {
					const ignored = currentIgnoredSlots[index];
					if (ignored === undefined) continue;
					const resolvedSlots = ignored.slotsMap.get();
					const slot = resolvedSlots[ignored.styleId] as ClipSlot | undefined;
					if (slot?.clip != null) ignoredStyleIds.push(ignored.styleId);
				}
				ignoredStyleIds.sort();
			}

			legacyIssues.sort((left, right) => {
				const leftKey = `${left.styleId}:${left.reason}:${left.detail ?? ""}`;
				const rightKey = `${right.styleId}:${right.reason}:${right.detail ?? ""}`;
				return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
			});

			return {
				directGestureStreaming: interpolatorProps.active.gesture.dragging !== 0,
				entries,
				ignoredStyleIds,
				invalidStyleId,
				legacyIssues,
				routeKey,
			};
		},
		(next, previous) => {
			if (preparedBatchEquals(previous, next)) return;
			if (previous?.routeKey !== next.routeKey) {
				updateClipStreamRootRouteOnUI(rootId, next.routeKey);
				if (nativePromotionEnabled) {
					runOnJS(moveRuntimeRoot)(next.routeKey);
				}
			}
			if (shouldWarn) {
				if (next.invalidStyleId !== null) {
					runOnJS(warnInvalidClipSlot)(next.invalidStyleId);
				}
				for (let index = 0; index < next.ignoredStyleIds.length; index += 1) {
					const styleId = next.ignoredStyleIds[index];
					if (styleId !== undefined) runOnJS(warnIgnoredClipSlot)(styleId);
				}
				for (let index = 0; index < next.legacyIssues.length; index += 1) {
					const issue = next.legacyIssues[index];
					if (issue !== undefined) runOnJS(warnLegacyClipIssue)(issue);
				}
			}

			// A malformed participant rejects the complete frame. This preserves the
			// group driver's all-or-nothing contract instead of partially updating
			// the remaining apertures.
			if (
				next.directGestureStreaming ||
				next.invalidStyleId !== null ||
				next.entries.length === 0
			) {
				return;
			}
			for (let index = 0; index < next.entries.length; index += 1) {
				const entry = next.entries[index];
				if (
					entry?.renderState !== undefined &&
					entry.nextRenderState !== undefined
				) {
					const currentRenderState = entry.renderState.get();
					if (
						currentRenderState.mode !== entry.nextRenderState.mode ||
						currentRenderState.overflowLatched !==
							entry.nextRenderState.overflowLatched
					) {
						entry.renderState.set(entry.nextRenderState);
					}
				}
			}
			setFrames(next.entries);
		},
		[
			moveRuntimeRoot,
			nativePromotionEnabled,
			rootId,
			screenInterpolatorProps,
			screenInterpolatorPropsRevision,
			setFrames,
			shouldWarn,
		],
	);

	const registerParticipant = useCallback(
		(entry: ClipStreamParticipantRegistration) => {
			const { runtimeController, trustedPlans, ...streamParticipant } = entry;
			participantsRef.current.set(
				streamParticipant.registrationId,
				streamParticipant,
			);
			participants.set(Array.from(participantsRef.current.values()));
			const unregisterRuntimeParticipant =
				globalSmoothClipCoordinatorRuntime.registerParticipant({
					clip: runtimeController.ref,
					registrationId: entry.registrationId,
					rootId,
					slotId: entry.styleId,
					streamingSuspended: entry.streamingSuspended,
					trustedPlans,
				});
			return () => {
				unregisterRuntimeParticipant();
				participantsRef.current.delete(entry.registrationId);
				participants.set(Array.from(participantsRef.current.values()));
			};
		},
		[participants, rootId],
	);
	const registerIgnoredSlot = useCallback(
		(entry: IgnoredClipSlot) => {
			ignoredSlotsRef.current.set(entry.registrationId, entry);
			ignoredSlots.set(Array.from(ignoredSlotsRef.current.values()));
			return () => {
				ignoredSlotsRef.current.delete(entry.registrationId);
				ignoredSlots.set(Array.from(ignoredSlotsRef.current.values()));
			};
		},
		[ignoredSlots],
	);
	const value = useMemo<ClipStreamContextValue>(
		() => ({ registerIgnoredSlot, registerParticipant }),
		[registerIgnoredSlot, registerParticipant],
	);

	return (
		<ClipStreamContext.Provider value={value}>
			{children}
		</ClipStreamContext.Provider>
	);
}

type ScreenClipStreamProviderProps = {
	children: ReactNode;
	kind?: SmoothClipPhysicalRootKind;
};

/**
 * Owns the only clip streaming reaction for a physical screen. Nested slot
 * providers (notably FloatOverlay) attach to the existing owner instead of
 * creating another per-frame reaction.
 */
export function ScreenClipStreamProvider({
	children,
	kind = "screen",
}: ScreenClipStreamProviderProps) {
	const parent = useContext(ClipStreamContext);
	const { currentScreenKey } = useDescriptorDerivations();
	if (parent !== null) return children;
	return (
		<ClipStreamRoot initialRouteKey={currentScreenKey} kind={kind}>
			{children}
		</ClipStreamRoot>
	);
}

export function useClipStreamRegistration({
	base,
	controller,
	slotsMap,
	styleId,
	trustedPlans,
}: {
	base: SmoothClipPresentation;
	controller: SmoothClipController;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	styleId: string;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
}) {
	const context = useContext(ClipStreamContext);
	if (context === null) {
		throw new Error(
			"Transition.ClipView must render inside a screen transition slot provider.",
		);
	}
	const registrationId = useRef(allocateClipRegistrationId()).current;
	const streamingSuspended = useSharedValue(0);
	const canonicalBase = useMemo(
		() => canonicalizeClipPresentation(base),
		[base],
	);
	if (canonicalBase === null) {
		throw new Error(
			"Transition.ClipView clip must contain only finite values and contentScale must be greater than zero.",
		);
	}

	useLayoutEffect(() => {
		return context.registerParticipant({
			base: canonicalBase,
			clip: controller.ref,
			projection: "explicit",
			registrationId,
			runtimeController: controller,
			slotsMap,
			streamingSuspended,
			styleId,
			trustedPlanIds: trustedPlans?.map((plan) => plan.id),
			trustedPlans,
		});
	}, [
		canonicalBase,
		context,
		controller,
		registrationId,
		slotsMap,
		streamingSuspended,
		styleId,
		trustedPlans,
	]);
}

/** Registers a deprecated geometric-mask consumer with the one screen stream. */
export function useLegacyClipStreamRegistration({
	base,
	controller,
	enabled = true,
	footprint,
	renderState,
	slotsMap,
	styleId,
	trustedPlans,
}: {
	base: SmoothClipPresentation;
	controller: SmoothClipController;
	enabled?: boolean;
	footprint: LegacyClipFootprint;
	renderState: SharedValue<LegacyClipRenderState>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	styleId: string;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
}) {
	const context = useContext(ClipStreamContext);
	if (context === null) {
		throw new Error(
			"Legacy geometric masks must render inside a screen transition slot provider.",
		);
	}
	const registrationId = useRef(allocateClipRegistrationId()).current;
	const streamingSuspended = useSharedValue(0);
	const canonicalBase = useMemo(
		() => canonicalizeClipPresentation(base),
		[base],
	);
	if (canonicalBase === null) {
		throw new Error("Legacy geometric mask base presentation must be finite.");
	}

	useLayoutEffect(() => {
		if (!enabled) return;
		return context.registerParticipant({
			base: canonicalBase,
			clip: controller.ref,
			footprint,
			projection: "legacy",
			registrationId,
			renderState,
			runtimeController: controller,
			slotsMap,
			streamingSuspended,
			styleId,
			trustedPlanIds: trustedPlans?.map((plan) => plan.id),
			trustedPlans,
		});
	}, [
		canonicalBase,
		context,
		controller,
		enabled,
		footprint,
		registrationId,
		renderState,
		slotsMap,
		streamingSuspended,
		styleId,
		trustedPlans,
	]);
}

export function useIgnoredClipSlot(
	styleId: string | undefined,
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>,
) {
	const context = useContext(ClipStreamContext);
	const registrationId = useRef(allocateClipRegistrationId()).current;

	useLayoutEffect(() => {
		if (context === null || styleId === undefined) return;
		return context.registerIgnoredSlot({ registrationId, slotsMap, styleId });
	}, [context, registrationId, slotsMap, styleId]);
}
