export type BoundsSyncZoomItem = {
	id: string;
	title: string;
	subtitle: string;
	color: string;
	/** Width multiplier relative to a single grid column (1 = half, 2 = full width) */
	cols: 1 | 2;
	/** Height in points */
	height: number;
};

export const BOUNDS_SYNC_ZOOM_ITEMS: BoundsSyncZoomItem[] = [
	// Row 1: two squares
	{
		id: "atlas",
		title: "Atlas Board",
		subtitle: "Square source",
		color: "#3A86FF",
		cols: 1,
		height: 170,
	},
	{
		id: "ember",
		title: "Ember Notes",
		subtitle: "Square source",
		color: "#FB5607",
		cols: 1,
		height: 170,
	},
	// Row 2: full-width banner
	{
		id: "horizon",
		title: "Horizon",
		subtitle: "Wide banner source",
		color: "#8338EC",
		cols: 2,
		height: 120,
	},
	// Row 3: tall + short
	{
		id: "jade",
		title: "Jade Gallery",
		subtitle: "Tall source",
		color: "#2A9D8F",
		cols: 1,
		height: 260,
	},
	{
		id: "coral",
		title: "Coral Drift",
		subtitle: "Short source",
		color: "#E63946",
		cols: 1,
		height: 110,
	},
	// Row 4: small + wide
	{
		id: "mint",
		title: "Mint",
		subtitle: "Tiny square",
		color: "#06D6A0",
		cols: 1,
		height: 90,
	},
	{
		id: "slate",
		title: "Slate Docs",
		subtitle: "Wide half-width",
		color: "#457B9D",
		cols: 1,
		height: 140,
	},
	// Row 5: full-width tall
	{
		id: "dusk",
		title: "Dusk Player",
		subtitle: "Full-width tall source",
		color: "#1D3557",
		cols: 2,
		height: 200,
	},
	// Row 6: three-ish feel (two uneven)
	{
		id: "peach",
		title: "Peach",
		subtitle: "Compact",
		color: "#FF9F1C",
		cols: 1,
		height: 130,
	},
	{
		id: "noir",
		title: "Noir",
		subtitle: "Tall narrow",
		color: "#2B2D42",
		cols: 1,
		height: 220,
	},
];

export const getBoundsSyncZoomItemById = (id: string | undefined) => {
	if (!id) return BOUNDS_SYNC_ZOOM_ITEMS[0];
	return (
		BOUNDS_SYNC_ZOOM_ITEMS.find((item) => item.id === id) ??
		BOUNDS_SYNC_ZOOM_ITEMS[0]
	);
};
