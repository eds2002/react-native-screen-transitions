import { useLayoutEffect } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { logger } from "../../../utils/logger";
import {
	TARGET_OUTSIDE_ROOT_WARNING,
	useBoundaryRootContext,
} from "../providers/boundary-root.provider";

interface RegisterTargetProps {
	targetAnimatedRef: AnimatedRef<View>;
	preparedStyles: Record<string, any>;
	measurementRef: AnimatedRef<View>;
}

export const useRegisterTarget = ({
	targetAnimatedRef,
	preparedStyles,
	measurementRef,
}: RegisterTargetProps) => {
	const rootContext = useBoundaryRootContext();
	const registerTargetRef = rootContext?.registerTargetRef;
	const unregisterTargetRef = rootContext?.unregisterTargetRef;
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
};
