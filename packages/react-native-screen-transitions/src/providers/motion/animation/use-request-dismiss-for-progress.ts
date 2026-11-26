import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { runOnUISync } from "react-native-worklets";
import { IS_WEB } from "../../../constants";
import type { ProgressRequest } from "../types";

export function useRequestDismissForProgress(
	progressRequest: SharedValue<ProgressRequest>,
	requestDismiss?: () => void,
) {
	const request = useCallback(
		(id: number) => {
			const isCurrent = () => {
				"worklet";
				const current = progressRequest.get();
				return current.id === id && current.phase !== "idle";
			};
			if (IS_WEB ? isCurrent() : runOnUISync(isCurrent)) requestDismiss?.();
		},
		[progressRequest, requestDismiss],
	);
	return requestDismiss ? request : undefined;
}
