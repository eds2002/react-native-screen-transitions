import type {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";

export type ScreenSlotName =
	| "overlay"
	| "content"
	| "surface"
	| "backdrop"
	| "clip"
	| typeof NAVIGATION_MASK_CONTAINER_STYLE_ID
	| typeof NAVIGATION_MASK_ELEMENT_STYLE_ID;
