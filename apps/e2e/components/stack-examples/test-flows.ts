export const TEST_FLOWS = [
	{
		id: "stack-progress",
		title: "Stack Progress",
		description: "Demonstrates stackProgress accumulating across screens",
	},
	{
		id: "overlay",
		title: "Floating Overlay",
		description: "Tab bar overlay that animates with screen transitions",
	},
	{
		id: "custom-background",
		title: "Custom Surface",
		description:
			"Fast squircle surface component with animated corner smoothing",
	},
	{
		id: "bottom-sheet",
		title: "Sheets",
		description: "Sheet transitions across vertical and horizontal directions",
	},
	{
		id: "gestures",
		title: "Gestures",
		description:
			"One focused route per gesture direction, including pinch-in and pinch-out",
	},
	{
		id: "bounds",
		title: "Bounds",
		description: "Focused bounds examples for custom masks, zoom, and sync",
	},
] satisfies {
	id: string;
	title: string;
	description: string;
}[];

// Touch gating should come back as its own focused group rather than living
// inside the general stack examples.

export const PRESET_FLOWS = [
	{
		id: "slide-vertical",
		title: "Slide from Bottom",
		description: "Vertical slide with swipe-to-dismiss",
	},
	{
		id: "slide-top",
		title: "Slide from Top",
		description: "Vertical inverted slide with swipe-to-dismiss",
	},
	{
		id: "zoom-in",
		title: "Zoom In",
		description: "Centered scale and fade transition",
	},
	{
		id: "draggable-card",
		title: "Draggable Card",
		description: "Multi-directional drag with card scaling",
	},
	{
		id: "elastic-card",
		title: "Elastic Card",
		description: "Elastic drag with overlay darkening",
	},
	{
		id: "shared-x-image",
		title: "Shared X Image",
		description:
			"Deprecated SharedXImage preset for feed card -> fullscreen media",
	},
] satisfies {
	id: string;
	title: string;
	description: string;
}[];

export const BACKDROP_FLOWS = [
	{
		id: "custom",
		title: "Custom Backdrop",
		description: "BlurView backdrop component with tap-to-dismiss behavior",
	},
	{
		id: "dismiss",
		title: "Dismiss Behavior",
		description: "Backdrop taps dismiss the active sheet",
	},
	{
		id: "collapse",
		title: "Collapse Behavior",
		description: "Backdrop taps collapse to the lower snap before dismissing",
	},
	{
		id: "block",
		title: "Block Behavior",
		description: "Backdrop taps stay captured behind the sheet",
	},
	{
		id: "passthrough",
		title: "Passthrough Behavior",
		description: "Backdrop taps pass through to the screen underneath",
	},
] satisfies {
	id: string;
	title: string;
	description: string;
}[];
