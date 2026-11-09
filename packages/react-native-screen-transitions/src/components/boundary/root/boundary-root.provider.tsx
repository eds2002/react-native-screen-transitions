import {
	type ForwardedRef,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { type SharedValue, useAnimatedRef } from "react-native-reanimated";
import { useBuilderStore } from "../../../providers/builder";
import { useOptionalScreenHostStore } from "../../../providers/host/screen-host.provider";
import type { BoundTag } from "../../../stores/bounds";
import { createBoundTag } from "../../../stores/bounds";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";
import { BoundaryLifecycle } from "../measure/boundary-lifecycle";
import { useFirstEscapeMeasureKey } from "../measure/first-escape-measure";
import { createLocalMeasurementRef } from "../measure/local-measurements";
import { queueForgetLocalMeasurement } from "../measure/measure-registry";
import { hasPresentLink } from "../measure/use-boundary-presence";
import { useBoundaryEscapeState } from "../portal/utils/is-escaped";
import { resolveBoundaryPortal } from "../portal/utils/resolve-portal";
import {
	BoundaryPresentationDriver,
	type BoundaryPresentationHandles,
	useIdleBoundaryPresentation,
} from "../presentation/use-boundary-presentation";
import { useComposedBoundaryStyle } from "../presentation/use-composed-boundary-style";
import type {
	BoundaryConfigProps,
	BoundaryId,
	BoundaryLocalMeasurementValue,
	BoundaryOwnProps,
} from "../types";

type BoundaryRootContextValue = BoundaryRootRenderState;

// logger.warn prepends the library prefix.
const MULTIPLE_TARGETS_WARNING =
	"Multiple Boundary.Target elements were rendered under the same boundary root. The first target in render order will be measured.";

export const TARGET_OUTSIDE_ROOT_WARNING =
	"Boundary.Target must be rendered inside Transition.Boundary or a component created by createBoundaryComponent.";

type BoundaryRootRenderState = {
	boundaryPresentation: BoundaryPresentationHandles["presentation"];
	slotsMap: BoundaryPresentationHandles["slotsMap"];
	attachedStyle: unknown;
	boundTag: BoundTag;
	currentScreenKey: string;
	/** This boundary has been measured for a transition, so it has (or is getting) an overlay host. */
	escapeMeasured: boolean;
	handoffEnabled: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	measurementRef: AnimatedRef<View>;
	portalRuntime: ReturnType<typeof resolveBoundaryPortal>;
	ref: RefObject<View | null>;
	/** Set by the overlay once this boundary's host is placed. */
	portalHostReady: SharedValue<boolean>;
	shouldRenderBoundaryRootThroughPortal: boolean;
	shouldRenderHandoffHost: boolean;
};

type BoundaryRootProviderProps = Pick<
	BoundaryOwnProps,
	"enabled" | "escapeClipping" | "group" | "handoff"
> & {
	children: (state: BoundaryRootRenderState) => ReactNode;
	config: BoundaryConfigProps;
	forwardedRef?: ForwardedRef<any>;
	hasTarget: boolean;
	id: BoundaryId;
	style?: unknown;
	/** The root's own style when its box goes to an escape placeholder (see splitBoundaryLayoutStyle). */
	rootStyle?: unknown;
	targetCount: number;
	targetStyle?: unknown;
};

export const {
	BoundaryRootProvider,
	useBoundaryRootStore,
	useOptionalBoundaryRootStore,
} = createProvider("BoundaryRoot")<
	BoundaryRootProviderProps,
	BoundaryRootContextValue
>(
	({
		children,
		config,
		enabled = true,
		escapeClipping,
		forwardedRef,
		group,
		handoff,
		hasTarget,
		id,
		style,
		rootStyle = style,
		targetCount,
		targetStyle,
	}) => {
		const requestedBoundTag = useMemo(
			() => createBoundTag(String(id), group),
			[id, group],
		);
		const portalRuntime = useMemo(
			() => resolveBoundaryPortal({ handoff, escapeClipping }),
			[handoff, escapeClipping],
		);

		const currentScreenKey = useBuilderStore(
			(s) => s.derivations.currentScreenKey,
		);
		const isCurrentScreenClosing = useOptionalScreenHostStore(
			(store) =>
				portalRuntime.handoff &&
				store?.scenesByKey[currentScreenKey]?.activity === "closing",
		);
		const retainedBoundTagRef = useRef(requestedBoundTag);
		const shouldRetainClosingBoundTag =
			portalRuntime.handoff && isCurrentScreenClosing;

		// Navigation can update a retained closing route's params before that
		// route leaves the stack. Keep its handoff identity stable so the payload
		// remains attached to the closing destination instead of being orphaned.
		if (!shouldRetainClosingBoundTag) {
			retainedBoundTagRef.current = requestedBoundTag;
		}

		const boundTag = retainedBoundTagRef.current;
		// Associated slot styles attach whenever the boundary is enabled,
		// independent of whether an interpolator is configured for this transition.
		const shouldAttachAssociatedStyles = enabled;
		const shouldEscapeBoundaryRootToScreenHost = portalRuntime.escapeClipping;

		// A boundary arriving as its pair's destination is measured as its screen mounts, and its
		// escape (overlay host, teleport, pair presentation) would then be set up over the first frames
		// of the transition: a burst of commits while the screen starts moving. Its partner is already
		// on the screen below, so it starts set up instead, in its screen's own mount commit.
		const arrivesLinked = useBuilderStore(
			(s) =>
				!s.derivations.nextScreenKey &&
				!!s.derivations.previousScreenKey &&
				hasPresentLink(
					s.derivations.previousScreenKey,
					requestedBoundTag.linkKey,
				),
		);
		const [escapeMeasured, setEscapeMeasured] = useState(
			() => enabled && portalRuntime.escapeClipping && arrivesLinked,
		);
		const onFirstEscapeMeasure = useCallback(() => setEscapeMeasured(true), []);
		// The boundary's number: its first-measure notification and its measurement map entry.
		const firstEscapeMeasureKey =
			useFirstEscapeMeasureKey(onFirstEscapeMeasure);
		const localMeasurement = useMemo(
			() => createLocalMeasurementRef(firstEscapeMeasureKey),
			[firstEscapeMeasureKey],
		);
		useEffect(
			() => () => queueForgetLocalMeasurement(firstEscapeMeasureKey),
			[firstEscapeMeasureKey],
		);

		// Following pair presentations costs UI work on every bounds change and every transition
		// frame: only boundaries taking part in a transition (handoff, or escaping and measured for a
		// pair) do it, through a driver mounted while they do. The rest read their screen's slots.
		const engaged =
			enabled &&
			(portalRuntime.handoff ||
				(portalRuntime.escapeClipping && escapeMeasured));
		const idlePresentation = useIdleBoundaryPresentation();
		const [engagedPresentation, setEngagedPresentation] =
			useState<BoundaryPresentationHandles | null>(null);
		const presentationReady = engaged && engagedPresentation !== null;
		const {
			presentation: boundaryPresentation,
			slotsMap,
			portalHostReady,
		} = presentationReady ? engagedPresentation : idlePresentation;

		// Only a boundary following its pairs can escape: at rest its style needs no escape inputs.
		const escapesRoot =
			shouldEscapeBoundaryRootToScreenHost && !hasTarget && presentationReady;
		const escapeState = useBoundaryEscapeState(
			escapesRoot,
			boundTag.tag,
			boundaryPresentation,
			localMeasurement,
			portalHostReady,
		);
		const associatedStyles = useComposedBoundaryStyle(
			slotsMap,
			boundTag.tag,
			shouldEscapeBoundaryRootToScreenHost && !hasTarget ? rootStyle : style,
			hasTarget ? "stacking" : "full",
			escapeState,
		);

		// One view is measured on the UI thread: the escape placeholder, the target, or else the root.
		// Only that one needs an animated ref; the root otherwise takes a plain one.
		const measurementRef = useAnimatedRef<View>();
		const plainRootRef = useRef<View>(null);

		useLayoutEffect(() => {
			if (__DEV__ && targetCount > 1) {
				logger.warnOnce("boundary:multiple-targets", MULTIPLE_TARGETS_WARNING);
			}
		}, [targetCount]);

		const rootRef =
			hasTarget || shouldEscapeBoundaryRootToScreenHost
				? plainRootRef
				: measurementRef;
		const measuredRef = measurementRef;

		useImperativeHandle(forwardedRef, () => rootRef.current as any, [rootRef]);

		const shouldRenderBoundaryRootThroughPortal =
			shouldEscapeBoundaryRootToScreenHost && !hasTarget;
		const handoffEnabled = enabled && portalRuntime.handoff;
		// A nested active target takes the full associated style, so the root keeps
		// only its stacking context. Root-owned escape-clipping moves the root
		// through a screen host, so transforms apply through the host while layout dimensions
		// also apply to the escaped element.
		// Host-only handoff receivers still need the associated style: their
		// handoff host is absolute-filled inside this root, so the root is the
		// visual frame that animates the received payload.
		const attachedStyle = shouldAttachAssociatedStyles
			? associatedStyles
			: undefined;

		const value = useMemo<BoundaryRootContextValue>(
			() => ({
				boundaryPresentation,
				slotsMap,
				attachedStyle,
				boundTag,
				currentScreenKey,
				// The overlay host and the escape portal start once the boundary follows its pairs.
				escapeMeasured: escapeMeasured && presentationReady,
				handoffEnabled,
				localMeasurement,
				measurementRef,
				portalRuntime,
				portalHostReady,
				ref: rootRef,
				shouldRenderBoundaryRootThroughPortal,
				shouldRenderHandoffHost: handoffEnabled && !hasTarget,
			}),
			[
				boundaryPresentation,
				slotsMap,
				attachedStyle,
				boundTag,
				currentScreenKey,
				escapeMeasured,
				presentationReady,
				handoffEnabled,
				hasTarget,
				localMeasurement,
				measurementRef,
				portalRuntime,
				portalHostReady,
				rootRef,
				shouldRenderBoundaryRootThroughPortal,
			],
		);

		return {
			value,
			children: (
				<>
					{children(value)}
					{engaged ? (
						<BoundaryPresentationDriver
							boundaryId={boundTag.tag}
							onChange={setEngagedPresentation}
						/>
					) : null}
					<BoundaryLifecycle
						boundTag={boundTag}
						config={config}
						currentScreenKey={currentScreenKey}
						enabled={enabled}
						handoff={portalRuntime.handoff}
						localMeasurement={localMeasurement}
						measuredRef={measuredRef}
						firstEscapeMeasureKey={firstEscapeMeasureKey}
						style={hasTarget ? targetStyle : style}
					/>
				</>
			),
		};
	},
);
