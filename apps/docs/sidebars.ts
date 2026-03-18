import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
	docsSidebar: [
		{
			type: "category",
			label: "Getting Started",
			collapsible: false,
			collapsed: false,
			items: [
				"intro",
				"getting-started/installation",
				"getting-started/quickstart",
				"stack-variants/index",
				"core-mental-model/index",
			],
		},
		{
			type: "category",
			label: "Animation",
			collapsible: false,
			collapsed: false,
			items: [
				"presets/index",
				"custom-transitions/index",
				"hooks-and-coordination/index",
			],
		},
		{
			type: "category",
			label: "Bounds",
			collapsible: false,
			collapsed: false,
			items: [
				"shared-elements-bounds/index",
				"bounds-helper/index",
				"navigation-zoom/index",
			],
		},
		{
			type: "category",
			label: "Gestures",
			collapsible: false,
			collapsed: false,
			items: [
				"gestures-snap-points/index",
				"gesture-ownership/index",
				"scroll-handoff/index",
				"snap-points-sheets/index",
			],
		},
		{
			type: "category",
			label: "Patterns",
			collapsible: false,
			collapsed: false,
			items: [
				"recipes/index",
				"performance/index",
				"migration/index",
			],
		},
		{
			type: "category",
			label: "Reference",
			collapsible: false,
			collapsed: false,
			items: [
				"api/index",
				"release-notes/index",
			],
		},
	],
};

export default sidebars;
