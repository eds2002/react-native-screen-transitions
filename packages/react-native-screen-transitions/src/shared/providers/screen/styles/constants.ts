import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as const;

const ALWAYS_RESET_STYLE_VALUES = {
	opacity: 1,
	zIndex: 0,
	elevation: 0,
	overflow: "visible",
	backgroundColor: "transparent",
	borderColor: "transparent",
	borderRadius: 0,
	shadowColor: "transparent",
	shadowOffset: { width: 0, height: 0 },
} as const;

export const STYLE_RESET_VALUES: Record<string, unknown> = {
	transform: IDENTITY_TRANSFORM,
	opacity: ALWAYS_RESET_STYLE_VALUES.opacity,
	zIndex: ALWAYS_RESET_STYLE_VALUES.zIndex,
	elevation: ALWAYS_RESET_STYLE_VALUES.elevation,
	overflow: ALWAYS_RESET_STYLE_VALUES.overflow,
	backgroundColor: ALWAYS_RESET_STYLE_VALUES.backgroundColor,
	borderColor: ALWAYS_RESET_STYLE_VALUES.borderColor,
	borderTopColor: ALWAYS_RESET_STYLE_VALUES.borderColor,
	borderRightColor: ALWAYS_RESET_STYLE_VALUES.borderColor,
	borderBottomColor: ALWAYS_RESET_STYLE_VALUES.borderColor,
	borderLeftColor: ALWAYS_RESET_STYLE_VALUES.borderColor,
	borderRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderTopLeftRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderTopRightRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderBottomRightRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderBottomLeftRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderTopStartRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderTopEndRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderBottomStartRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderBottomEndRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderStartStartRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderStartEndRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderEndStartRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	borderEndEndRadius: ALWAYS_RESET_STYLE_VALUES.borderRadius,
	shadowColor: ALWAYS_RESET_STYLE_VALUES.shadowColor,
	shadowOffset: ALWAYS_RESET_STYLE_VALUES.shadowOffset,
};

export const PROP_RESET_VALUES: Record<string, unknown> = {
	pointerEvents: "auto",
};

const LOCAL_ONLY_STYLE_SLOT_IDS = {
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
