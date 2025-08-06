import { useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Bounds } from "../navigator/stores/bounds";

interface BoundActivatorProps {
	sharedBoundTag?: string;
	children: React.ReactNode;
	measure: () => void;
}

export const BoundActivator = ({
	sharedBoundTag,
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

	if (!sharedBoundTag) return children;

	return <GestureDetector gesture={tapGesture}>{children}</GestureDetector>;
};
