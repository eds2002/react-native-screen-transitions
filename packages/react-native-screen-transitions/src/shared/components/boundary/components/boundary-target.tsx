import type React from "react";
import { memo, useLayoutEffect, useMemo } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import {
	useComposedSlotStyles,
	useSlotLayoutStyles,
} from "../../../providers/screen/styles";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import { logger } from "../../../utils/logger";
import { Portal } from "../portal/components/portal";
import {
	TARGET_OUTSIDE_ROOT_WARNING,
	useBoundaryRootContext,
} from "../providers/boundary-root.provider";

type BoundaryTargetProps = React.ComponentProps<typeof Animated.View>;

export const BoundaryTarget = memo(function BoundaryTarget(
	props: BoundaryTargetProps,
) {
	const { style, ...rest } = props;
	const targetAnimatedRef = useAnimatedRef<View>();
	const placeholderAnimatedRef = useAnimatedRef<View>();
	const rootContext = useBoundaryRootContext();
	const registerTargetRef = rootContext?.registerTargetRef;
	const unregisterTargetRef = rootContext?.unregisterTargetRef;
	const isActiveTarget = rootContext?.activeTargetRef === targetAnimatedRef;
	const portalRuntime = rootContext?.portalRuntime;
	const shouldApplyAssociatedStyleInline =
		isActiveTarget && portalRuntime?.enabled !== true;
	const shouldApplyPortalLayoutStyle =
		isActiveTarget && portalRuntime?.enabled === true;
	const associatedTargetStyles = useComposedSlotStyles(
		rootContext?.boundTag.tag,
		style,
	);
	const portalLayoutStyle = useSlotLayoutStyles(rootContext?.boundTag.tag);
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
	// Teleported content can render outside its layout slot. The placeholder is
	// the truthful measurement surface whenever runtime portal behavior is active.
	const measurementRef = portalRuntime?.enabled
		? placeholderAnimatedRef
		: targetAnimatedRef;

	useLayoutEffect(() => {
		if (!registerTargetRef || !unregisterTargetRef) {
			if (__DEV__) {
				logger.warn(TARGET_OUTSIDE_ROOT_WARNING);
			}
			return;
		}

		registerTargetRef(targetAnimatedRef, preparedStyles, measurementRef);
		return () => {
			unregisterTargetRef(targetAnimatedRef);
		};
	}, [
		registerTargetRef,
		unregisterTargetRef,
		targetAnimatedRef,
		preparedStyles,
		measurementRef,
	]);

	return (
		<Portal
			id={rootContext?.boundTag.tag}
			handoff={portalRuntime?.handoff}
			escapeClipping={portalRuntime?.escapeClipping}
			placeholderRef={placeholderAnimatedRef}
		>
			<Animated.View
				{...rest}
				ref={targetAnimatedRef}
				style={[
					style,
					shouldApplyAssociatedStyleInline ? associatedTargetStyles : undefined,
					shouldApplyPortalLayoutStyle ? portalLayoutStyle : undefined,
				]}
				collapsable={false}
			/>
		</Portal>
	);
});
