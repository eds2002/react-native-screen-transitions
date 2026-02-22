export type ZoomIdItem = {
	id: string;
	title: string;
	subtitle: string;
	image: string;
	bgColor: string;
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
		bgColor: "#0E141C",
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
		image: "https://picsum.photos/id/1025/1200/800",
		bgColor: "#1A120F",
		description:
			"A candid portrait study in natural light. The shallow depth of field isolates the subject against a soft, painterly background of greens and earth tones.",
		location: "Portland, Oregon",
		camera: "85mm f/1.2",
		aspectRatio: 3 / 2,
	},
	{
		id: "coast",
		title: "Coastline",
		subtitle: "Clean natural framing",
		image: "https://picsum.photos/id/1016/1200/800",
		bgColor: "#0C171A",
		description:
			"The desert meets the coast in this layered composition. Warm sandstone in the foreground gives way to cool twilight skies, creating a natural temperature gradient across the frame.",
		location: "Sedona, Arizona",
		camera: "24mm f/8",
		aspectRatio: 3 / 2,
	},
	{
		id: "metro",
		title: "Metro Signal",
		subtitle: "High-contrast urban texture",
		image: "https://picsum.photos/id/1031/1200/800",
		bgColor: "#151515",
		description:
			"Looking upward through converging glass and steel. The geometric repetition of the facade creates rhythm and tension, amplified by the high-contrast processing.",
		location: "Chicago, Illinois",
		camera: "16mm f/11",
		aspectRatio: 3 / 2,
	},
	{
		id: "drift",
		title: "Drift",
		subtitle: "Soft long-exposure motion",
		image: "https://picsum.photos/id/1039/1200/800",
		bgColor: "#0F1318",
		description:
			"A long exposure transforms rushing water into silk. The contrast between the sharp rocks and the flowing current speaks to the passage of time in a single frame.",
		location: "Iceland",
		camera: "50mm f/16, 4s",
		aspectRatio: 3 / 2,
	},
	{
		id: "grain",
		title: "Grain Fields",
		subtitle: "Pastoral warmth",
		image: "https://picsum.photos/id/1040/1200/800",
		bgColor: "#161208",
		description:
			"Late afternoon light rakes across an open field, turning ordinary grasses into strands of gold. The simplicity of the composition lets the color and texture speak for themselves.",
		location: "Tuscany, Italy",
		camera: "70mm f/2.8",
		aspectRatio: 3 / 2,
	},
];

export const getZoomIdItemById = (id: string | undefined) => {
	if (!id) return ZOOM_ID_ITEMS[0];
	return ZOOM_ID_ITEMS.find((item) => item.id === id) ?? ZOOM_ID_ITEMS[0];
};
