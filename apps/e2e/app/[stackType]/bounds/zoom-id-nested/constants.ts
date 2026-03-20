export type NestedZoomIdItem = {
	id: string;
	title: string;
	subtitle: string;
	image: string;
	bgColor: string;
	description: string;
	location: string;
	stay: string;
	bestFor: string;
	aspectRatio: number;
	relatedIds: string[];
};

export const NESTED_ZOOM_ID_ITEMS: NestedZoomIdItem[] = [
	{
		id: "nebraska",
		title: "Nebraska",
		subtitle: "Big sky routes and quiet prairie towns",
		image: "https://picsum.photos/id/1011/1200/800",
		bgColor: "#10151C",
		description:
			"A slower kind of road trip. Nebraska works when you want open sky, long train-track horizons, and a destination that feels calm instead of over-programmed.",
		location: "Lincoln, Nebraska",
		stay: "2-3 days",
		bestFor: "Road trip reset",
		aspectRatio: 3 / 2,
		relatedIds: ["sedona", "savannah", "monterey"],
	},
	{
		id: "sedona",
		title: "Sedona",
		subtitle: "Red rock trails with dramatic sunset light",
		image: "https://picsum.photos/id/1016/1200/800",
		bgColor: "#1A120E",
		description:
			"Sedona feels punchier and more sculpted. The payoff is fast: bold terrain, short scenic drives, and a detail page that should feel perfect for a nested zoom handoff.",
		location: "Sedona, Arizona",
		stay: "2-4 days",
		bestFor: "Weekend escape",
		aspectRatio: 3 / 2,
		relatedIds: ["nebraska", "santa-fe", "aspen"],
	},
	{
		id: "savannah",
		title: "Savannah",
		subtitle: "Historic blocks and warm evening walks",
		image: "https://picsum.photos/id/1031/1200/800",
		bgColor: "#151311",
		description:
			"Savannah trades landscape scale for atmosphere. It is slower, more layered, and easy to re-open from inside the destination because the content structure stays consistent.",
		location: "Savannah, Georgia",
		stay: "3 days",
		bestFor: "Walkable city breaks",
		aspectRatio: 3 / 2,
		relatedIds: ["nebraska", "charleston", "monterey"],
	},
	{
		id: "monterey",
		title: "Monterey",
		subtitle: "Coastline drives and cool marine light",
		image: "https://picsum.photos/id/1040/1200/800",
		bgColor: "#0D171B",
		description:
			"Monterey is the softer coastal counterpart. It gives the example a different color temperature while still being the same route and same content model when you push deeper.",
		location: "Monterey, California",
		stay: "2 days",
		bestFor: "Scenic coast stops",
		aspectRatio: 3 / 2,
		relatedIds: ["nebraska", "charleston", "sedona"],
	},
	{
		id: "aspen",
		title: "Aspen",
		subtitle: "Clean mountain air and high-contrast mornings",
		image: "https://picsum.photos/id/1039/1200/800",
		bgColor: "#0E1318",
		description:
			"Aspen gives this set a colder mountain profile. It is useful here because the route stack stays the same while the visual personality changes sharply between pushes.",
		location: "Aspen, Colorado",
		stay: "3-4 days",
		bestFor: "Mountain itineraries",
		aspectRatio: 3 / 2,
		relatedIds: ["sedona", "santa-fe", "nebraska"],
	},
	{
		id: "santa-fe",
		title: "Santa Fe",
		subtitle: "Adobe textures and dry evening color",
		image: "https://picsum.photos/id/1025/1200/800",
		bgColor: "#19110E",
		description:
			"Santa Fe keeps the western palette but shifts the rhythm toward galleries, courtyards, and slower detail. It is a good nested target because the source cards read clearly at smaller sizes.",
		location: "Santa Fe, New Mexico",
		stay: "2-3 days",
		bestFor: "Design-heavy trips",
		aspectRatio: 3 / 2,
		relatedIds: ["sedona", "aspen", "savannah"],
	},
	{
		id: "charleston",
		title: "Charleston",
		subtitle: "Pastel streets and humid coastal air",
		image: "https://picsum.photos/id/1020/1200/800",
		bgColor: "#17120F",
		description:
			"Charleston rounds out the set with a softer architectural route. The important part is that it uses the exact same screen shape, so nested pushes stay easy to inspect.",
		location: "Charleston, South Carolina",
		stay: "2 days",
		bestFor: "Food and architecture",
		aspectRatio: 3 / 2,
		relatedIds: ["savannah", "monterey", "nebraska"],
	},
];

export const getNestedZoomIdItemById = (id: string | undefined) => {
	if (!id) {
		return NESTED_ZOOM_ID_ITEMS[0];
	}

	return (
		NESTED_ZOOM_ID_ITEMS.find((item) => item.id === id) ?? NESTED_ZOOM_ID_ITEMS[0]
	);
};

export const getNestedZoomIdRelatedItems = (id: string | undefined) => {
	const item = getNestedZoomIdItemById(id);
	return item.relatedIds
		.map((relatedId) =>
			NESTED_ZOOM_ID_ITEMS.find((candidate) => candidate.id === relatedId),
		)
		.filter((candidate): candidate is NestedZoomIdItem => Boolean(candidate));
};
