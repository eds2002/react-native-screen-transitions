import { useFrameCallback } from "react-native-reanimated";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import useStableCallback from "../use-stable-callback";

/**
 * Maintainer Notes:
 * Marking as experimental for now since, I'll be honest, I'm not sure if this does much. This was taken
 * right from this https://github.com/software-mansion/react-native-reanimated/issues/4738
 *
 * Not noticing much of a difference in prod.
 */
export const useHighRefreshRate = (current: BaseDescriptor) => {
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
