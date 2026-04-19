export type NestedBoundsItem = {
	id: string;
	title: string;
	subtitle: string;
	image: string;
	accent: string;
	background: string;
	location: string;
	duration: string;
	pace: string;
	bestTime: string;
	overview: string;
	highlights: string[];
	plan: string[];
};

export const NESTED_BOUNDS_ITEMS: NestedBoundsItem[] = [
	{
		id: "nordic-coast",
		title: "Nordic Coast",
		subtitle: "Cold air, warm light, quiet cliffs",
		image: "https://picsum.photos/id/1018/1200/1200",
		accent: "#8AD8FF",
		background: "#081923",
		location: "Faroe Islands",
		duration: "3 days",
		pace: "Moderate",
		bestTime: "May to September",
		overview:
			"A coastal route with short ridge walks, sea views, and compact village stops that work well for a long weekend.",
		highlights: ["Kallur cliffs", "Blue hour harbor", "Wind-cut stone trails"],
		plan: ["Day 1: Harbor check-in and sunset loop", "Day 2: Ridge trail and cliff lookout", "Day 3: Village market and return ferry"],
	},
	{
		id: "metro-night",
		title: "Metro Night",
		subtitle: "Architecture lines and late city glow",
		image: "https://picsum.photos/id/1035/1200/1200",
		accent: "#B0A5FF",
		background: "#120B24",
		location: "Seoul",
		duration: "2 days",
		pace: "Fast",
		bestTime: "October to March",
		overview:
			"An urban photo route focused on skyline decks, transit corridors, and lit storefront streets after dark.",
		highlights: ["Sky deck at blue hour", "Neon crosswalk block", "Subway corridor frames"],
		plan: ["Day 1: Skyline deck and river walk", "Day 2: Transit loop and market district"],
	},
	{
		id: "canyon-loop",
		title: "Canyon Loop",
		subtitle: "Dry heat, wide skies, layered rock",
		image: "https://picsum.photos/id/1022/1200/1200",
		accent: "#FFC58A",
		background: "#22150B",
		location: "Sedona",
		duration: "4 days",
		pace: "Moderate",
		bestTime: "March to May",
		overview:
			"A loop built around sunrise trailheads and late-day overlooks, with short drives between core points.",
		highlights: ["Bell Rock sunrise", "Cathedral overlook", "Red stone canyon drive"],
		plan: ["Day 1: Arrival and lower canyon hike", "Day 2: Sunrise trail + midtown break", "Day 3: Scenic drive and west rim", "Day 4: Short summit and checkout"],
	},
	{
		id: "rainforest",
		title: "Rainforest",
		subtitle: "Waterfall air and dense green cover",
		image: "https://picsum.photos/id/1043/1200/1200",
		accent: "#93E0A4",
		background: "#0B1D13",
		location: "Costa Rica",
		duration: "5 days",
		pace: "Easy",
		bestTime: "December to April",
		overview:
			"A relaxed nature itinerary with forest paths, river overlooks, and short waterfall stops at low intensity.",
		highlights: ["Cloud forest bridge", "River canopy walk", "Hidden falls trail"],
		plan: ["Day 1: Lodge arrival and short forest loop", "Day 2: Canopy bridge and river stop", "Day 3: Free morning and waterfall hike", "Day 4: Wildlife reserve and hot springs", "Day 5: Coffee farm and departure"],
	},
];

export function getNestedBoundsItemById(id: string | undefined) {
	if (!id) return NESTED_BOUNDS_ITEMS[0];
	return NESTED_BOUNDS_ITEMS.find((item) => item.id === id) ?? NESTED_BOUNDS_ITEMS[0];
}
