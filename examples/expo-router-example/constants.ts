import Transition from "react-native-screen-transitions";

export const mainExampleGroups = {
	single: {
		label: "Individual Screen Transitions",
		desc: "Examples of different transition animations configured for each screen within a Stack navigator using listeners props.",
		routes: [
			{
				label: "Slide from top",
				href: "/a" as const,
				preset: Transition.Presets.SlideFromTop(),
			},
			{
				label: "Zoom in",
				href: "/b" as const,
				preset: Transition.Presets.ZoomIn(),
			},
			{
				label: "Slide from bottom",
				href: "/c" as const,
				preset: Transition.Presets.SlideFromBottom(),
			},
			{
				label: "Draggable Card",
				href: "/d" as const,
				preset: Transition.Presets.DraggableCard(),
			},
			{
				label: "Elastic Card",
				href: "/e" as const,
				preset: Transition.Presets.ElasticCard(),
			},
		],
	},
	group: {
		label: "Nested Navigator Animations",
		desc: "Example showing how to create animations for nested navigators - the navigator itself has a slide transition while child screens use their own native animations.",
		routes: [
			{
				label: "Nested navigator with animations",
				href: "/group-a/a" as const,
			},
		],
	},
	custom: {
		label: "Screen-Level Custom Animations",
		desc: "Examples of custom animations defined at the screen level using useScreenAnimation hook, rather than at the navigator level.",
		routes: [
			{
				label: "useScreenAnimation hook example",
				href: "/custom" as const,
			},
		],
	},
	nested: {
		label: "Nested Layout Animations",
		desc: "Complex example showing nested navigators with layered animations - each navigator slides down from top, while child screens have their own custom transitions.",
		routes: [
			{
				label: "Nested layout animations",
				href: "/nested/one" as const,
			},
		],
	},
};

export const mocksExampleGroups = {
	single: {
		label: "Profile Palette",
		desc: "A profile screen with a palette of colors.",
		href: "/mocks/palette-profile" as const,
	},
	gallery: {
		label: "Gallery Modal",
		desc: "A gallery modal with a parallax effect.",
		href: "/mocks/gallery-modal" as const,
	},
	deleteWarning: {
		label: "Delete Warning",
		desc: "A delete warning screen with a custom transition.",
		href: "/mocks/delete-warning" as const,
	},
	fullscreen: {
		label: "Fullscreen Navigation",
		desc: "A fullscreen navigation with a custom transition.",
		href: "/mocks/fullscreen-nav" as const,
	},
};
