import { useEffect, useLayoutEffect } from "react";
import { AppState } from "react-native";
import {
	globalSmoothClipCoordinatorRuntime,
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
} from "../../../providers/screen/clips/coordinator/runtime-store";

export const useSmoothClipRouteLifecycle = (routeKey: string) => {
	useLayoutEffect(() => {
		if (!INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION) return;
		return () => {
			globalSmoothClipCoordinatorRuntime.detachRoute(routeKey);
		};
	}, [routeKey]);

	useEffect(() => {
		if (!INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION) return;
		return AppState.addEventListener("change", (state) => {
			if (state !== "active") {
				globalSmoothClipCoordinatorRuntime.finishRoute(routeKey);
			}
		}).remove;
	}, [routeKey]);
};
