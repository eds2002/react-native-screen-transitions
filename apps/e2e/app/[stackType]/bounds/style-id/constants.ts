export const STYLE_ID_GROUP = "style-id-sync";

export type StyleIdMode = "group" | "single";

export type StyleImageItem = {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	source: string;
};

export const STYLE_ID_IMAGES = [
	{
		id: "atlas",
		title: "Atlas Frame",
		subtitle: "Alpine light study",
		description:
			"Golden light settles across a quiet alpine lake, giving the transition a cleaner landscape subject with strong color and depth.",
		source: "https://picsum.photos/id/1011/1000/1000",
	},
	{
		id: "coast",
		title: "Coastline",
		subtitle: "Warm rock and open sky",
		description:
			"Layered sandstone and blue distance make the shared element easier to read while the mask closes back into the grid.",
		source: "https://picsum.photos/id/1016/1000/1000",
	},
	{
		id: "drift",
		title: "Drift",
		subtitle: "Soft water motion",
		description:
			"A long-exposure water scene with clear contrast between the bright flow and darker surrounding texture.",
		source: "https://picsum.photos/id/1039/1000/1000",
	},
	{
		id: "grain",
		title: "Grain Fields",
		subtitle: "Pastoral warmth",
		description:
			"Late afternoon grasses bring a calmer, warmer frame that still exposes crop and clipping issues clearly.",
		source: "https://picsum.photos/id/1040/1000/1000",
	},
	{
		id: "summit",
		title: "Summit Ridge",
		subtitle: "Panoramic mountain depth",
		description:
			"Layered ridgelines give the final close position a more obvious visual anchor than the old random image set.",
		source: "https://picsum.photos/id/1036/1000/1000",
	},
	{
		id: "canopy",
		title: "Canopy Light",
		subtitle: "Dappled forest tones",
		description:
			"Soft forest light gives the grid a darker, textured option for checking edge masking during dismissal.",
		source: "https://picsum.photos/id/1047/1000/1000",
	},
] satisfies StyleImageItem[];

export const toStyleImageTag = (id: string) => `shared-image-${id}`;

export const getStyleImageIndexByTag = (tag: string | undefined): number => {
	const index = STYLE_ID_IMAGES.findIndex(
		(item) => toStyleImageTag(item.id) === tag,
	);

	return index === -1 ? 0 : index;
};
