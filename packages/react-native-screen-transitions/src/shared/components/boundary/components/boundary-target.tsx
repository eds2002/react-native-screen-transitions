import type React from "react";
import { memo, useLayoutEffect, useMemo } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useSlotLayoutStyles } from "../../../providers/screen/styles";
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
	const shouldApplyAssociatedStyleInline =
		isActiveTarget && rootContext?.portal === undefined;
	const shouldApplyPortalLayoutStyle =
		isActiveTarget && rootContext?.portal !== undefined;
	const portalLayoutStyle = useSlotLayoutStyles(rootContext?.boundTag.tag);
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
	// Portal'd content can be teleported into another screen's host; measuring
	// it there would capture its CURRENT (destination) position as the source
	// bounds. The portal placeholder keeps the layout slot at home, so it is
	// the truthful measurement surface whenever a portal is configured.
	const measurementRef = rootContext?.portal
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
			portal={rootContext?.portal}
			placeholderRef={placeholderAnimatedRef}
		>
			<Animated.View
				{...rest}
				ref={targetAnimatedRef}
				style={[
					style,
					shouldApplyAssociatedStyleInline
						? rootContext.associatedTargetStyles
						: undefined,
					shouldApplyPortalLayoutStyle ? portalLayoutStyle : undefined,
				]}
				collapsable={false}
			/>
		</Portal>
	);
});
