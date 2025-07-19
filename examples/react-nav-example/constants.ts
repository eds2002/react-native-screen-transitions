import Transition from "react-native-screen-transitions";

export const mainExampleGroups = {
	single: {
		label: "Individual Screen Transitions",
		desc: "Examples of different transition animations configured for each screen within a navigator.",
		routes: [
			{
				label: "Slide from top",
				screen: "ScreenA" as const,
				preset: Transition.presets.SlideFromTop(),
			},
			{
				label: "Zoom in",
				screen: "ScreenB" as const,
				preset: Transition.presets.ZoomIn(),
			},
			{
				label: "Slide from bottom",
				screen: "ScreenC" as const,
				preset: Transition.presets.SlideFromBottom(),
			},
			{
				label: "Draggable Card",
				screen: "ScreenD" as const,
				preset: Transition.presets.DraggableCard(),
			},
			{
				label: "Elastic Card",
				screen: "ScreenE" as const,
				preset: Transition.presets.ElasticCard(),
			},
		],
	},
	group: {
		label: "Nested Navigator Animations",
		desc: "Example showing how to create animations for nested navigators - the navigator itself has a slide transition while child screens use their own native animations.",
		routes: [
			{
				label: "Nested navigator with animations",
				screen: "GroupA" as const,
			},
		],
	},
	custom: {
		label: "Screen-Level Custom Animations",
		desc: "Examples of custom animations defined at the screen level using useScreenAnimation hook, rather than at the navigator level.",
		routes: [
			{
				label: "useScreenAnimation hook example",
				screen: "Custom" as const,
			},
		],
	},
	nested: {
		label: "Nested Layout Animations",
		desc: "Complex example showing nested navigators with layered animations - each navigator slides down from top, while child screens have their own custom transitions.",
		routes: [
			{
				label: "Nested layout animations",
				screen: "Nested" as const,
			},
		],
	},
};
export const mocksExampleGroups = {
	single: {
		label: "Profile Palette",
		desc: "A profile screen with a palette of colors.",
		screen: "PaletteProfile" as const,
	},
	gallery: {
		label: "Gallery Modal",
		desc: "A gallery modal with a list of images.",
		screen: "GalleryModal" as const,
	},
	delete: {
		label: "Delete Warning",
		desc: "A delete warning with a list of items.",
		screen: "DeleteWarning" as const,
	},
	fullscreen: {
		label: "Fullscreen Nav",
		desc: "A fullscreen nav with a list of links.",
		screen: "FullscreenNav" as const,
	},
};
