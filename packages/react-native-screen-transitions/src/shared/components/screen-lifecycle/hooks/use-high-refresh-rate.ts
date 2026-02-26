import { useFrameCallback } from "react-native-reanimated";
import useStableCallback from "../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../providers/screen/keys";

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
