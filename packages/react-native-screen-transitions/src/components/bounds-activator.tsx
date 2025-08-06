import { useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Bounds } from "../navigator/stores/bounds";

interface BoundActivatorProps {
	sharedBoundTag?: string;
	enableTap?: boolean;
	children: React.ReactNode;
	measure: () => void;
}

export const BoundActivator = ({
	sharedBoundTag,
	enableTap = true,
	children,
	measure,
}: BoundActivatorProps) => {
	const tapGesture = useMemo(() => {
		return Gesture.Tap().onStart(() => {
			"worklet";
			if (sharedBoundTag) {
				Bounds.setActiveBoundId(sharedBoundTag);
				measure();
			}
		});
	}, [sharedBoundTag, measure]);

	if (!enableTap || !sharedBoundTag) return children;

	return <GestureDetector gesture={tapGesture}>{children}</GestureDetector>;
};
