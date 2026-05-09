import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scale: 1 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as const;

/**
 * Safe identity resets for transition-owned style props.
 *
 * This list should stay limited to props with a predictable neutral value after
 * an animation finishes. Avoid layout-owning props such as width, height, top,
 * left, margin, padding, flex, or aspectRatio; resetting those to zero can clip
 * or collapse user layout. If another visual-only transition prop needs cleanup,
 * please add its identity value here in a PR.
 */
export const STYLE_RESET_VALUES: Record<string, unknown> = {
	transform: IDENTITY_TRANSFORM,
	translateX: 0,
	translateY: 0,
	scale: 1,
	scaleX: 1,
	scaleY: 1,
	opacity: 1,
	zIndex: 0,
	elevation: 0,
	overflow: "visible",
	backgroundColor: "transparent",
	borderColor: "transparent",
	borderTopColor: "transparent",
	borderRightColor: "transparent",
	borderBottomColor: "transparent",
	borderLeftColor: "transparent",
	borderStartColor: "transparent",
	borderEndColor: "transparent",
	borderRadius: 0,
	borderTopLeftRadius: 0,
	borderTopRightRadius: 0,
	borderBottomRightRadius: 0,
	borderBottomLeftRadius: 0,
	borderTopStartRadius: 0,
	borderTopEndRadius: 0,
	borderBottomStartRadius: 0,
	borderBottomEndRadius: 0,
	borderStartStartRadius: 0,
	borderStartEndRadius: 0,
	borderEndStartRadius: 0,
	borderEndEndRadius: 0,
	shadowColor: "transparent",
	shadowOffset: { width: 0, height: 0 },
	shadowOpacity: 0,
	shadowRadius: 0,
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
