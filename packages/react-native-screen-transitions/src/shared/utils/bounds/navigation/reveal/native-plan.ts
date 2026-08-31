import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import { defineBuiltInClipNativePlan } from "../clip/native-plan";

/** Internal promotion description; runtime ownership is intentionally separate. */
export const REVEAL_CLIP_NATIVE_PLAN = defineBuiltInClipNativePlan({
	id: "reveal",
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
			residualChannels: ["shadow", "opacity"],
			promotionBlockers: [],
		},
		{
			slotId: NAVIGATION_MASK_ELEMENT_STYLE_ID,
			geometry: "uniform-corners",
			curve: "option",
			ownsContentTranslation: false,
			ownsContentScale: false,
			residualChannels: [],
			promotionBlockers: [],
		},
	],
});
