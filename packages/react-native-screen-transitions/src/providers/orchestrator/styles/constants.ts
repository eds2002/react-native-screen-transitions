import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../navigation-mask-ids";

export { STYLE_RESET_VALUES } from "../../../style-reset-values";

export const PROP_RESET_VALUES: Record<string, unknown> = {
	// A teleport without a host name renders its content in place.
	hostName: null,
	pointerEvents: "auto",
};

const RESERVED_STYLE_SLOT_IDS = {
	clip: true,
	overlay: true,
	content: true,
	surface: true,
	backdrop: true,
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]: true,
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]: true,
} as const;

export const isReservedStyleSlot = (slotId: string) => {
	"worklet";
	// biome-ignore lint/suspicious/noPrototypeBuiltins: <proj issue>
	return Object.prototype.hasOwnProperty.call(RESERVED_STYLE_SLOT_IDS, slotId);
};

export const shouldSlotInherit = (slotId: string) => {
	"worklet";
	return !isReservedStyleSlot(slotId);
};
