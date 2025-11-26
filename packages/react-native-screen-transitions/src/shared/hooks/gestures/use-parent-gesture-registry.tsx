import { useEffect } from "react";
import { useGestureContext } from "../../providers/gestures";
import useStableCallback from "../use-stable-callback";

/**
 * Registers native gestures with parent gestures to enable proper gesture handling
 * in nested navigators that contain scrollable content.
 */
export const useParentGestureRegistry = () => {
	const { parentContext, nativeGesture } = useGestureContext();
	const registerNativeGesture = useStableCallback(() => {
		if (parentContext?.panGesture && nativeGesture) {
			parentContext.panGesture.blocksExternalGesture(nativeGesture);
		}
	});

	useEffect(() => {
		registerNativeGesture();
	}, [registerNativeGesture]);
};
