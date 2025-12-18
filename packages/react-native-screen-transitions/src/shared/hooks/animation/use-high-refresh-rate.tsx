import { useFrameCallback } from "react-native-reanimated";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import useStableCallback from "../use-stable-callback";

export const useHighRefreshRate = (current: BaseDescriptor) => {
	// Force display to run at max refresh rate during transitions only
	const enableHighRefreshRate =
		current.options.experimental_enableHighRefreshRate ?? false;

	const frameCallback = useFrameCallback(() => {}, false);

	const activateHighRefreshRate = useStableCallback(() => {
		if (enableHighRefreshRate) {
			frameCallback.setActive(true);
		}
	});

	const deactivateHighRefreshRate = useStableCallback(() => {
		if (enableHighRefreshRate) {
			frameCallback.setActive(false);
		}
	});

	return {
		activateHighRefreshRate,
		deactivateHighRefreshRate,
	};
};
