export type ZoomItem = {
	id: string;
	title: string;
	subtitle: string;
	color: string;
};

export const ZOOM_ITEMS: ZoomItem[] = [
	{
		id: "orchid",
		title: "Orchid Room",
		subtitle: "Soft gradients and portraits",
		color: "#7A5CFF",
	},
	{
		id: "citrus",
		title: "Citrus Club",
		subtitle: "Warm tones and travel stories",
		color: "#FF9F1C",
	},
	{
		id: "mint",
		title: "Mint House",
		subtitle: "Minimal edits and clean layouts",
		color: "#2EC4B6",
	},
	{
		id: "ruby",
		title: "Ruby Archive",
		subtitle: "Moody light and contrast",
		color: "#E71D36",
	},
];

export const getZoomItemById = (id: string | undefined) => {
	if (!id) return ZOOM_ITEMS[0];
	return ZOOM_ITEMS.find((item) => item.id === id) ?? ZOOM_ITEMS[0];
};
