import {
	type ComponentType,
	forwardRef,
	memo,
	type ReactNode,
	useImperativeHandle,
	useMemo,
} from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useDescriptorsStore } from "../../providers/screen/descriptors";
import {
	useComposedSlotStyles,
	useSlotStackingStyles,
} from "../../providers/screen/styles";
import { createBoundTag } from "../../stores/bounds/helpers/link-pairs.helpers";
import { useBoundaryMeasurement } from "./hooks/use-boundary-measurement";
import { BoundaryHandoffPortalHost } from "./portal/components/boundary-handoff-portal-host";
import { Portal } from "./portal/components/portal";
import { resolveBoundaryPortal } from "./portal/utils/resolve-portal";
import {
	BoundaryRootProvider,
	useBoundaryRootState,
} from "./providers/boundary-root.provider";
import type { BoundaryComponentProps } from "./types";

interface CreateBoundaryComponentOptions {
	alreadyAnimated?: boolean;
}

const hasRenderableChildren = (children: ReactNode): boolean => {
	if (
		children === null ||
		children === undefined ||
		typeof children === "boolean"
	) {
		return false;
	}

	if (Array.isArray(children)) {
		return children.some(hasRenderableChildren);
	}

	return true;
};

export function createBoundaryComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateBoundaryComponentOptions = {},
) {
	const { alreadyAnimated = false } = options;
	const AnimatedComponent = alreadyAnimated
		? Wrapped
		: Animated.createAnimatedComponent(Wrapped);

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		BoundaryComponentProps<P>
	>((props, forwardedRef) => {
		const {
			enabled = true,
			group,
			id,
			anchor,
			scaleMode,
			target,
			method,
			style,
			handoff,
			escapeClipping,
			children,
			...rest
		} = props as any;

		const boundTag = useMemo(
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
		const hasConfiguredInterpolator = useDescriptorsStore(
			(s) => s.derivations.hasConfiguredInterpolator,
		);
		const runtimeEnabled = enabled && hasConfiguredInterpolator;
		// Associated slot styles attach whenever the boundary is enabled,
		// independent of whether an interpolator is configured for this transition.
		const shouldAttachAssociatedStyles = enabled;
		const hasBoundaryChildren = hasRenderableChildren(children);
		const shouldEscapeBoundaryRoot = portalRuntime.escapeClipping;
		const canPortalBoundaryRootAsPayload =
			portalRuntime.handoff && !shouldEscapeBoundaryRoot && hasBoundaryChildren;
		const canTeleportBoundaryRoot =
			shouldEscapeBoundaryRoot || canPortalBoundaryRootAsPayload;

		const associatedStyles = useComposedSlotStyles(boundTag.tag, style);
		const associatedStackingStyles = useSlotStackingStyles(boundTag.tag);
		const rootPlaceholderRef = useAnimatedRef<View>();

		const {
			ref,
			contextValue,
			measuredRef,
			hasActiveTarget,
			targetPreparedStyles,
		} = useBoundaryRootState({
			boundTag,
			portalRuntime,
			rootMeasurementRef: canTeleportBoundaryRoot
				? rootPlaceholderRef
				: undefined,
		});

		useBoundaryMeasurement({
			boundTag,
			enabled,
			runtimeEnabled,
			currentScreenKey,
			measuredRef,
			style,
			targetPreparedStyles,
			handoff: portalRuntime.handoff,
			escapeClipping: portalRuntime.escapeClipping,
			config: { anchor, scaleMode, target, method },
		});

		const shouldPortalRootAsHandoffPayload =
			canPortalBoundaryRootAsPayload && !hasActiveTarget;
		const shouldPortalRoot =
			shouldEscapeBoundaryRoot || shouldPortalRootAsHandoffPayload;
		const shouldRenderHandoffHost = !shouldPortalRootAsHandoffPayload;
		// A nested active target takes the full associated style, so the root keeps
		// only its stacking context. Without a nested target, a teleported root is
		// the target, so its associated style is applied through the host instead of
		// inline on the teleported element.
		// Host-only handoff receivers still need the associated style: their
		// handoff host is absolute-filled inside this root, so the root is the
		// visual frame that animates the received payload.
		const attachedStyle = shouldAttachAssociatedStyles
			? hasActiveTarget
				? associatedStackingStyles
				: shouldPortalRoot
					? undefined
					: associatedStyles
			: undefined;

		const boundaryRoot = (
			<AnimatedComponent
				{...rest}
				ref={ref}
				style={[style, attachedStyle]}
				collapsable={false}
			>
				{children}
				{shouldRenderHandoffHost ? (
					<BoundaryHandoffPortalHost
						boundaryId={boundTag.tag}
						enabled={enabled && portalRuntime.handoff}
						screenKey={currentScreenKey}
					/>
				) : null}
			</AnimatedComponent>
		);

		useImperativeHandle(forwardedRef, () => ref.current as any, [ref]);

		return (
			<BoundaryRootProvider value={contextValue}>
				{shouldPortalRoot ? (
					<Portal
						id={boundTag.tag}
						handoff={shouldPortalRootAsHandoffPayload}
						escapeClipping={portalRuntime.escapeClipping}
						placeholderRef={rootPlaceholderRef}
						placeholderStyle={style as any}
					>
						{boundaryRoot}
					</Portal>
				) : (
					boundaryRoot
				)}
			</BoundaryRootProvider>
		);
	});

	// The HOC's runtime identity (animated + memoized forwardRef) is not
	// expressible against the public boundary props, so assert it here.
	return memo(Inner) as unknown as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			BoundaryComponentProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
