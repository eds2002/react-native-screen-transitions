import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import { defineBuiltInClipNativePlan } from "../clip/native-plan";

/** Internal promotion description; runtime ownership is intentionally separate. */
export const ZOOM_CLIP_NATIVE_PLAN = defineBuiltInClipNativePlan({
	id: "zoom",
	protocolVersion: 2,
	trusted: true,
	projectionSpace: "output",
	requiresReadyFixedHost: true,
	requiresStableInputs: true,
	participants: [
		{
			slotId: "content",
			geometry: "uniform-corners",
			curve: "circular",
			ownsContentTranslation: true,
			ownsContentScale: true,
			residualChannels: ["rotation", "opacity"],
			promotionBlockers: ["rotation"],
		},
		{
			slotId: NAVIGATION_MASK_ELEMENT_STYLE_ID,
			geometry: "uniform-corners",
			curve: "continuous",
			ownsContentTranslation: false,
			ownsContentScale: false,
			residualChannels: [],
			promotionBlockers: [],
		},
	],
});
