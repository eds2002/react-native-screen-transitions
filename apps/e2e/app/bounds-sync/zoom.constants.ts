import { makeMutable } from "react-native-reanimated";

export const ZOOM_GROUP = "zoom-sync";

export type BoundsSyncZoomItem = {
	id: string;
	title: string;
	subtitle: string;
	color: string;
	/** Dark variant of color used as the detail screen background */
	bgColor: string;
	/** Description shown on the detail screen */
	description: string;
	/** Width multiplier relative to a single grid column (1 = half, 2 = full width) */
	cols: 1 | 2;
	/** Height in points */
	height: number;
};

export const BOUNDS_SYNC_ZOOM_ITEMS: BoundsSyncZoomItem[] = [
	{
		id: "lavender",
		title: "Lavender Haze",
		subtitle: "Soft purple pastel",
		color: "#B8A9E8",
		bgColor: "#1A1525",
		description:
			"A calming pastel purple that evokes fields of lavender at dusk. Perfect for backgrounds, cards, and gentle accents that need to feel serene without losing presence.",
		cols: 1,
		height: 170,
	},
	{
		id: "coral",
		title: "Coral Bloom",
		subtitle: "Warm pink-orange",
		color: "#FF8A80",
		bgColor: "#2A1210",
		description:
			"A vibrant coral that splits the difference between pink and orange. Use it to draw the eye without overwhelming — ideal for CTAs, badges, and interactive highlights.",
		cols: 1,
		height: 170,
	},
	{
		id: "sky",
		title: "Sky Wash",
		subtitle: "Clear pastel blue",
		color: "#82C4F8",
		bgColor: "#0E1D2C",
		description:
			"Inspired by a cloudless afternoon sky. This blue reads as trustworthy and open — great for info surfaces, onboarding flows, and anything that should feel approachable.",
		cols: 2,
		height: 120,
	},
	{
		id: "mint",
		title: "Mint Leaf",
		subtitle: "Fresh green pastel",
		color: "#7DDBA3",
		bgColor: "#0E2218",
		description:
			"A refreshing minty green that brings energy without intensity. Works beautifully for success states, progress indicators, and nature-themed interfaces.",
		cols: 1,
		height: 260,
	},
	{
		id: "peach",
		title: "Peach Fuzz",
		subtitle: "Gentle warm neutral",
		color: "#FFB7A5",
		bgColor: "#2B1A14",
		description:
			"Soft and inviting, this peach tone adds warmth to any palette. Pair it with deep navy or charcoal for a sophisticated, modern look that still feels friendly.",
		cols: 1,
		height: 110,
	},
	{
		id: "lemon",
		title: "Lemon Drop",
		subtitle: "Cheerful pastel yellow",
		color: "#FFE27A",
		bgColor: "#2A2510",
		description:
			"A sunlit yellow that stays easy on the eyes. Use sparingly as highlights, callout backgrounds, or rating accents — it lifts the mood instantly.",
		cols: 1,
		height: 90,
	},
	{
		id: "periwinkle",
		title: "Periwinkle",
		subtitle: "Blue-violet pastel",
		color: "#9DB2F2",
		bgColor: "#131828",
		description:
			"Sitting between blue and violet, periwinkle carries a creative, slightly playful energy. Ideal for creative tools, messaging UIs, and selection states.",
		cols: 1,
		height: 140,
	},
	{
		id: "rose",
		title: "Rose Quartz",
		subtitle: "Muted dusty pink",
		color: "#F2A7C3",
		bgColor: "#28121C",
		description:
			"A sophisticated dusty rose that balances warmth with restraint. Popular in editorial design, profile screens, and anywhere elegance meets accessibility.",
		cols: 2,
		height: 200,
	},
	{
		id: "sage",
		title: "Sage Mist",
		subtitle: "Muted earthy green",
		color: "#A8D5B5",
		bgColor: "#142019",
		description:
			"A grounded, organic green with gray undertones. Sage Mist feels mature and composed — use it for settings screens, toggle surfaces, and wellness UIs.",
		cols: 1,
		height: 130,
	},
	{
		id: "lilac",
		title: "Lilac Cloud",
		subtitle: "Airy light purple",
		color: "#D4B8E8",
		bgColor: "#1E1425",
		description:
			"Lighter and more ethereal than lavender, lilac cloud reads as premium and delicate. It pairs naturally with gold accents for luxury-feeling product pages.",
		cols: 1,
		height: 220,
	},
];

/**
 * Module-level mutable shared value tracking the currently visible item
 * in the detail pager. Written by onMomentumScrollEnd, read by the
 * layout interpolator to retarget bounds({ group, id }).navigation.zoom().
 */
export const activeZoomId = makeMutable(BOUNDS_SYNC_ZOOM_ITEMS[0].id);

export const getBoundsSyncZoomItemById = (id: string | undefined) => {
	if (!id) return BOUNDS_SYNC_ZOOM_ITEMS[0];
	return (
		BOUNDS_SYNC_ZOOM_ITEMS.find((item) => item.id === id) ??
		BOUNDS_SYNC_ZOOM_ITEMS[0]
	);
};
