import type React from "react";
import { memo, useLayoutEffect, useMemo } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
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
	const ownerContext = useBoundaryOwnerContext();
	const registerTargetRef = ownerContext?.registerTargetRef;
	const unregisterTargetRef = ownerContext?.unregisterTargetRef;
	const isActiveTarget = ownerContext?.activeTargetRef === targetAnimatedRef;
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

	useLayoutEffect(() => {
		if (!registerTargetRef || !unregisterTargetRef) {
			if (__DEV__) {
				console.warn(TARGET_OUTSIDE_OWNER_WARNING);
			}
			return;
		}

		registerTargetRef(targetAnimatedRef, preparedStyles);
		return () => {
			unregisterTargetRef(targetAnimatedRef);
		};
	}, [
		registerTargetRef,
		unregisterTargetRef,
		targetAnimatedRef,
		preparedStyles,
	]);

	return (
		<Animated.View
			{...rest}
			ref={targetAnimatedRef}
			style={[
				style,
				isActiveTarget ? ownerContext.associatedTargetStyles : undefined,
			]}
			collapsable={false}
		/>
	);
});
