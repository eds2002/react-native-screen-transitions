export type BoundsSyncZoomItem = {
	id: string;
	title: string;
	subtitle: string;
	color: string;
};

export const BOUNDS_SYNC_ZOOM_ITEMS: BoundsSyncZoomItem[] = [
	{
		id: "atlas",
		title: "Atlas Board",
		subtitle: "Navigation zoom from compact source",
		color: "#3A86FF",
	},
	{
		id: "ember",
		title: "Ember Notes",
		subtitle: "Mask-host zoom with larger destination",
		color: "#FB5607",
	},
	{
		id: "jade",
		title: "Jade Gallery",
		subtitle: "Uniform scale with drag-to-dismiss",
		color: "#2A9D8F",
	},
];

export const getBoundsSyncZoomItemById = (id: string | undefined) => {
	if (!id) return BOUNDS_SYNC_ZOOM_ITEMS[0];
	return BOUNDS_SYNC_ZOOM_ITEMS.find((item) => item.id === id)
		?? BOUNDS_SYNC_ZOOM_ITEMS[0];
};
