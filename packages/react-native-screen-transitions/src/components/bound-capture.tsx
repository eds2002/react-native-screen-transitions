import { useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useKeys } from "../providers/keys";
import { Bounds } from "../stores/bounds";

interface BoundActivatorProps {
	sharedBoundTag?: string;
	children: React.ReactNode;
	measure: () => void;
}

export const BoundCapture = ({
	sharedBoundTag,
	children,
	measure,
}: BoundActivatorProps) => {
	const { current } = useKeys();
	const routeKey = current.route.key;
	const tapGesture = useMemo(() => {
		return Gesture.Tap().onStart(() => {
			"worklet";
			if (sharedBoundTag) {
				Bounds.setRouteActive(routeKey, sharedBoundTag);
				measure();
			}
		});
	}, [sharedBoundTag, measure, routeKey]);

	if (!sharedBoundTag) return children;

	return <GestureDetector gesture={tapGesture}>{children}</GestureDetector>;
};
