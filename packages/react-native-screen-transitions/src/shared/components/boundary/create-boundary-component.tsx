import {
	type ComponentType,
	forwardRef,
	memo,
	useImperativeHandle,
	useMemo,
} from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useDescriptorsStore } from "../../providers/screen/descriptors";
import {
	useSlotStackingStyles,
	useSlotStyles,
} from "../../providers/screen/styles";
import { createBoundTag } from "../../stores/bounds/helpers/link-pairs.helpers";
import { useBoundaryMeasurement } from "./hooks/use-boundary-measurement";
import { Portal } from "./portal/components/portal";
import { resolveBoundaryPortal } from "./portal/utils/resolve-portal";
import {
	BoundaryRootProvider,
	useBoundaryRootState,
} from "./providers/boundary-root.provider";
import type { BoundaryComponentProps } from "./types";

interface CreateBoundaryComponentOptions {
	alreadyAnimated?: boolean;
	shouldAutoMeasure?: boolean;
}

export function createBoundaryComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateBoundaryComponentOptions = {},
) {
	const { alreadyAnimated = false, shouldAutoMeasure = false } = options;
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
			onPress,
			portal: portalProp,
			...rest
		} = props as any;

		const boundTag = useMemo(
			() => createBoundTag(String(id), group),
			[id, group],
		);
		const portal = resolveBoundaryPortal(portalProp);

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

		const associatedStyles = useSlotStyles(boundTag.tag);
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
			portal,
			rootMeasurementRef: portal ? rootPlaceholderRef : undefined,
			associatedTargetStyles: shouldAttachAssociatedStyles
				? associatedStyles
				: undefined,
		});

		const { onPress: resolvedOnPress } = useBoundaryMeasurement({
			boundTag,
			enabled,
			runtimeEnabled,
			currentScreenKey,
			measuredRef,
			style,
			targetPreparedStyles,
			portal,
			shouldAutoMeasure,
			config: { anchor, scaleMode, target, method },
			onPress,
		});

		useImperativeHandle(forwardedRef, () => ref.current as any, [ref]);

		const shouldPortalRoot = !!portal && !hasActiveTarget;
		// A nested active target takes the full associated style, so the root keeps
		// only its stacking context. Without a nested target, a portal'd root is the
		// target, so its associated style is applied through the portal host instead
		// of inline on the teleported element.
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
				onPress={resolvedOnPress}
				collapsable={false}
			/>
		);

		return (
			<BoundaryRootProvider value={contextValue}>
				{shouldPortalRoot ? (
					<Portal
						id={boundTag.tag}
						portal={portal}
						placeholderRef={rootPlaceholderRef}
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
	return memo(
		Animated.createAnimatedComponent(Inner),
	) as unknown as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			BoundaryComponentProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
