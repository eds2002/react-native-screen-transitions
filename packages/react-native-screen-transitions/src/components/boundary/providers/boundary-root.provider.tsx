import {
	type ForwardedRef,
	type ReactNode,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useAnimatedRef } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import {
	useComposedSlotStyles,
	useSlotStackingStyles,
} from "../../../providers/screen/styles";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import { createBoundTag } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type { BoundTag } from "../../../stores/bounds/types";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";
import { BoundaryLifecycle } from "../components/boundary-lifecycle";
import {
	type BoundaryPortalRuntime,
	resolveBoundaryPortal,
} from "../portal/utils/resolve-portal";
import type {
	BoundaryConfigProps,
	BoundaryId,
	BoundaryOwnProps,
} from "../types";

type BoundaryRootContextValue = BoundaryRootRenderState;

// logger.warn prepends the library prefix.
const MULTIPLE_TARGETS_WARNING =
	"Multiple Boundary.Target elements were rendered under the same boundary root. The first target in render order will be measured.";

export const TARGET_OUTSIDE_ROOT_WARNING =
	"Boundary.Target must be rendered inside Transition.Boundary or a component created by createBoundaryComponent.";

export type BoundaryRootRenderState = {
	attachedStyle: unknown;
	boundTag: BoundTag;
	currentScreenKey: string;
	handoffEnabled: boolean;
	measurementRef: AnimatedRef<View>;
	portalRuntime: BoundaryPortalRuntime;
	ref: AnimatedRef<View>;
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
	targetCount: number;
	targetStyle?: unknown;
};

export const { BoundaryRootProvider, useBoundaryRootStore } = createProvider(
	"BoundaryRoot",
	{ guarded: false },
)<BoundaryRootProviderProps, BoundaryRootContextValue>(
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
		targetCount,
		targetStyle,
	}) => {
		const requestedBoundTag = useMemo(
			() => createBoundTag(String(id), group),
			[id, group],
		);
		const portalRuntime = resolveBoundaryPortal({
			handoff,
			escapeClipping,
		});

		const currentScreenKey = useDescriptorsStore(
			(s) => s.derivations.currentScreenKey,
		);
		const isCurrentScreenClosing = useBlankStackStore(
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

		const associatedStyles = useComposedSlotStyles(boundTag.tag, style);
		const associatedStackingStyles = useSlotStackingStyles(boundTag.tag);
		const rootRef = useAnimatedRef<View>();
		const measurementRef = useAnimatedRef<View>();

		useLayoutEffect(() => {
			if (__DEV__ && targetCount > 1) {
				logger.warnOnce("boundary:multiple-targets", MULTIPLE_TARGETS_WARNING);
			}
		}, [targetCount]);

		const measuredRef =
			hasTarget || shouldEscapeBoundaryRootToScreenHost
				? measurementRef
				: rootRef;

		useImperativeHandle(forwardedRef, () => rootRef.current as any, [rootRef]);

		const shouldRenderBoundaryRootThroughPortal =
			shouldEscapeBoundaryRootToScreenHost && !hasTarget;
		const handoffEnabled = enabled && portalRuntime.handoff;
		// A nested active target takes the full associated style, so the root keeps
		// only its stacking context. Root-owned escape-clipping moves the root
		// through a screen host, so its associated style is applied through the
		// host instead of inline on the escaped element.
		// Host-only handoff receivers still need the associated style: their
		// handoff host is absolute-filled inside this root, so the root is the
		// visual frame that animates the received payload.
		const attachedStyle = shouldAttachAssociatedStyles
			? hasTarget
				? associatedStackingStyles
				: shouldRenderBoundaryRootThroughPortal
					? undefined
					: associatedStyles
			: undefined;

		const value = useMemo<BoundaryRootContextValue>(
			() => ({
				attachedStyle,
				boundTag,
				currentScreenKey,
				handoffEnabled,
				measurementRef,
				portalRuntime,
				ref: rootRef,
				shouldRenderBoundaryRootThroughPortal,
				shouldRenderHandoffHost: handoffEnabled && !hasTarget,
			}),
			[
				attachedStyle,
				boundTag,
				currentScreenKey,
				handoffEnabled,
				hasTarget,
				measurementRef,
				portalRuntime,
				rootRef,
				shouldRenderBoundaryRootThroughPortal,
			],
		);

		return {
			value,
			children: (
				<>
					{children(value)}
					<BoundaryLifecycle
						boundTag={boundTag}
						config={config}
						currentScreenKey={currentScreenKey}
						enabled={enabled}
						escapeClipping={portalRuntime.escapeClipping}
						handoff={portalRuntime.handoff}
						measuredRef={measuredRef}
						style={hasTarget ? targetStyle : style}
					/>
				</>
			),
		};
	},
);
