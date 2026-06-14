import type React from "react";
import { memo, useLayoutEffect, useMemo } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import { logger } from "../../../utils/logger";
import { Portal } from "../portal/components/portal";
import {
	TARGET_OUTSIDE_OWNER_WARNING,
	useBoundaryOwnerContext,
} from "../providers/boundary-owner.provider";

type BoundaryTargetProps = React.ComponentProps<typeof Animated.View>;

export const BoundaryTarget = memo(function BoundaryTarget(
	props: BoundaryTargetProps,
) {
	const { style, ...rest } = props;
	const targetAnimatedRef = useAnimatedRef<View>();
	const placeholderAnimatedRef = useAnimatedRef<View>();
	const ownerContext = useBoundaryOwnerContext();
	const registerTargetRef = ownerContext?.registerTargetRef;
	const unregisterTargetRef = ownerContext?.unregisterTargetRef;
	const isActiveTarget = ownerContext?.activeTargetRef === targetAnimatedRef;
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
	// Portal'd content can be teleported into another screen's host; measuring
	// it there would capture its CURRENT (destination) position as the source
	// bounds. The portal placeholder keeps the layout slot at home, so it is
	// the truthful measurement surface whenever a portal is configured.
	const measurementRef = ownerContext?.portal
		? placeholderAnimatedRef
		: targetAnimatedRef;

	useLayoutEffect(() => {
		if (!registerTargetRef || !unregisterTargetRef) {
			if (__DEV__) {
				logger.warn(TARGET_OUTSIDE_OWNER_WARNING);
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
			id={ownerContext?.entryTag}
			mode={ownerContext?.portal}
			placeholderRef={placeholderAnimatedRef}
		>
			<Animated.View
				{...rest}
				ref={targetAnimatedRef}
				style={[
					style,
					isActiveTarget ? ownerContext.associatedTargetStyles : undefined,
				]}
				collapsable={false}
			/>
		</Portal>
	);
});
