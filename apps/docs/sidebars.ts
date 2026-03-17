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
			label: "Building Transitions",
			collapsible: false,
			collapsed: false,
			items: [
				"presets/index",
				"custom-transitions/index",
				"shared-elements-bounds/index",
				"gestures-snap-points/index",
				"hooks-and-coordination/index",
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
