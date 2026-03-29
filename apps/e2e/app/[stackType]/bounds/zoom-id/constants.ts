export type ZoomIdItem = {
	id: string;
	title: string;
	subtitle: string;
	image: string;
	description: string;
	location: string;
	camera: string;
	aspectRatio: number;
};

export const ZOOM_ID_ITEMS: ZoomIdItem[] = [
	{
		id: "atlas",
		title: "Atlas Frame",
		subtitle: "Structured editorial look",
		image: "https://picsum.photos/id/1011/1200/800",

		description:
			"Captured during golden hour on a quiet alpine lake. The warmth of the light against the still water creates a meditative atmosphere that draws the eye toward the horizon.",
		location: "Lake Louise, Canada",
		camera: "35mm f/1.4",
		aspectRatio: 3 / 2,
	},
	{
		id: "ember",
		title: "Ember Portrait",
		subtitle: "Warm cinematic contrast",
		image: "https://picsum.photos/id/1025/800/800",

		description:
			"A candid portrait study in natural light. The shallow depth of field isolates the subject against a soft, painterly background of greens and earth tones.",
		location: "Portland, Oregon",
		camera: "85mm f/1.2",
		aspectRatio: 1,
	},
	{
		id: "coast",
		title: "Coastline",
		subtitle: "Clean natural framing",
		image: "https://picsum.photos/id/1016/800/800",

		description:
			"The desert meets the coast in this layered composition. Warm sandstone in the foreground gives way to cool twilight skies, creating a natural temperature gradient across the frame.",
		location: "Sedona, Arizona",
		camera: "24mm f/8",
		aspectRatio: 1,
	},
	{
		id: "metro",
		title: "Metro Signal",
		subtitle: "High-contrast urban texture",
		image: "https://picsum.photos/id/1031/600/900",

		description:
			"Looking upward through converging glass and steel. The geometric repetition of the facade creates rhythm and tension, amplified by the high-contrast processing.",
		location: "Chicago, Illinois",
		camera: "16mm f/11",
		aspectRatio: 2 / 3,
	},
	{
		id: "drift",
		title: "Drift",
		subtitle: "Soft long-exposure motion",
		image: "https://picsum.photos/id/1039/600/900",

		description:
			"A long exposure transforms rushing water into silk. The contrast between the sharp rocks and the flowing current speaks to the passage of time in a single frame.",
		location: "Iceland",
		camera: "50mm f/16, 4s",
		aspectRatio: 2 / 3,
	},
	{
		id: "grain",
		title: "Grain Fields",
		subtitle: "Pastoral warmth",
		image: "https://picsum.photos/id/1040/600/900",

		description:
			"Late afternoon light rakes across an open field, turning ordinary grasses into strands of gold. The simplicity of the composition lets the color and texture speak for themselves.",
		location: "Tuscany, Italy",
		camera: "70mm f/2.8",
		aspectRatio: 2 / 3,
	},
	{
		id: "summit",
		title: "Summit Ridge",
		subtitle: "Vast panoramic depth",
		image: "https://picsum.photos/id/1036/1400/600",

		description:
			"Standing at the edge of the ridgeline, the world unfolds in layers of blue and grey. The panoramic format emphasizes the sheer scale of the mountain range stretching to the horizon.",
		location: "Patagonia, Chile",
		camera: "24mm f/11",
		aspectRatio: 21 / 9,
	},
	{
		id: "bazaar",
		title: "Night Bazaar",
		subtitle: "Warm ambient glow",
		image: "https://picsum.photos/id/1029/800/800",

		description:
			"Lanterns cast overlapping pools of amber light across the narrow market alley. The shallow focus pulls you past the silhouetted crowd toward the warm glow at the far end.",
		location: "Marrakech, Morocco",
		camera: "35mm f/1.8",
		aspectRatio: 1,
	},
	{
		id: "canopy",
		title: "Canopy Light",
		subtitle: "Dappled forest tones",
		image: "https://picsum.photos/id/1047/800/800",

		description:
			"Sunlight filters through a dense canopy, breaking into beams that illuminate the mossy forest floor. The vertical composition draws the eye upward into the towering trees.",
		location: "Olympic National Park",
		camera: "24mm f/5.6",
		aspectRatio: 1,
	},
];

export type LayoutRow =
	| { type: "banner"; itemId: string }
	| { type: "pair"; itemIds: [string, string] }
	| { type: "triple"; itemIds: [string, string, string] };

export const GRID_LAYOUT: LayoutRow[] = [
	{ type: "banner", itemId: "atlas" },
	{ type: "pair", itemIds: ["ember", "coast"] },
	{ type: "triple", itemIds: ["metro", "drift", "grain"] },
	{ type: "banner", itemId: "summit" },
	{ type: "pair", itemIds: ["bazaar", "canopy"] },
];

export const getZoomIdItemById = (id: string | undefined) => {
	if (!id) return ZOOM_ID_ITEMS[0];
	return ZOOM_ID_ITEMS.find((item) => item.id === id) ?? ZOOM_ID_ITEMS[0];
};
