import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";

export const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as const;

export const ALWAYS_RESET_STYLE_VALUES = {
	opacity: 1,
	zIndex: 0,
	elevation: 0,
} as const;

export const LOCAL_ONLY_STYLE_SLOT_IDS = {
	content: true,
	backdrop: true,
	surface: true,
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]: true,
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]: true,
} as const;

export const shouldSlotInherit = (slotId: string) => {
	"worklet";
	// biome-ignore lint/suspicious/noPrototypeBuiltins: <proj issue>
	return !Object.prototype.hasOwnProperty.call(
		LOCAL_ONLY_STYLE_SLOT_IDS,
		slotId,
	);
};
