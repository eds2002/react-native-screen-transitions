import type React from "react";
import { memo, useLayoutEffect } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
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

	useLayoutEffect(() => {
		if (!registerTargetRef || !unregisterTargetRef) {
			if (__DEV__) {
				console.warn(TARGET_OUTSIDE_OWNER_WARNING);
			}
			return;
		}

		registerTargetRef(targetAnimatedRef);
		return () => {
			unregisterTargetRef(targetAnimatedRef);
		};
	}, [registerTargetRef, unregisterTargetRef, targetAnimatedRef]);

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
