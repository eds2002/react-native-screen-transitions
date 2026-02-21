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
		id: "atlas",
		title: "Atlas Board",
		subtitle: "Plan your next adventure",
		color: "#3A86FF",
		bgColor: "#0E2044",
		description:
			"Pin destinations, map routes, and organize your travel itinerary all in one place. Atlas Board keeps your wanderlust organized.",
		cols: 1,
		height: 170,
	},
	{
		id: "ember",
		title: "Ember Notes",
		subtitle: "Thoughts that spark ideas",
		color: "#FB5607",
		bgColor: "#3D1600",
		description:
			"Capture fleeting thoughts before they fade. Ember Notes uses a timeline-first approach so your best ideas are always within reach.",
		cols: 1,
		height: 170,
	},
	{
		id: "horizon",
		title: "Horizon",
		subtitle: "Daily weather at a glance",
		color: "#8338EC",
		bgColor: "#1F0E3A",
		description:
			"A minimal weather companion that shows you what matters — temperature, chance of rain, and golden hour. Nothing more, nothing less.",
		cols: 2,
		height: 120,
	},
	{
		id: "jade",
		title: "Jade Gallery",
		subtitle: "Your photo library, curated",
		color: "#2A9D8F",
		bgColor: "#0A2724",
		description:
			"Jade uses on-device intelligence to surface your best shots, group memories by moment, and build galleries that tell a story.",
		cols: 1,
		height: 260,
	},
	{
		id: "coral",
		title: "Coral Drift",
		subtitle: "Ambient soundscapes",
		color: "#E63946",
		bgColor: "#380D11",
		description:
			"Ocean waves, forest rain, crackling fire. Coral Drift generates infinite ambient soundscapes that adapt to your environment.",
		cols: 1,
		height: 110,
	},
	{
		id: "mint",
		title: "Mint",
		subtitle: "Split bills instantly",
		color: "#06D6A0",
		bgColor: "#02352A",
		description:
			"Scan a receipt, tag your friends, and settle up. Mint makes splitting the check painless — no awkward math required.",
		cols: 1,
		height: 90,
	},
	{
		id: "slate",
		title: "Slate Docs",
		subtitle: "Markdown meets design",
		color: "#457B9D",
		bgColor: "#111F28",
		description:
			"Write in markdown, publish something beautiful. Slate Docs bridges the gap between developer notes and polished documentation.",
		cols: 1,
		height: 140,
	},
	{
		id: "dusk",
		title: "Dusk Player",
		subtitle: "Music for the late hours",
		color: "#1D3557",
		bgColor: "#070D16",
		description:
			"A music player designed for nighttime listening. Warm EQ, crossfade between tracks, and a UI that won't blind you at 2am.",
		cols: 2,
		height: 200,
	},
	{
		id: "peach",
		title: "Peach",
		subtitle: "Recipes worth saving",
		color: "#FF9F1C",
		bgColor: "#402807",
		description:
			"Clip recipes from anywhere, scale ingredients for your group size, and follow step-by-step with hands-free voice mode.",
		cols: 1,
		height: 130,
	},
	{
		id: "noir",
		title: "Noir",
		subtitle: "Monochrome photo editor",
		color: "#2B2D42",
		bgColor: "#0B0B11",
		description:
			"Strip the color, find the emotion. Noir gives you precise control over contrast, grain, and tone curves for stunning black and white edits.",
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
