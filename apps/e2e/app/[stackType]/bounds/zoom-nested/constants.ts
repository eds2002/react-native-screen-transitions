import { makeMutable } from "react-native-reanimated";

export const NESTED_ZOOM_GROUP = "zoom-nested";

export type NestedZoomGroupItem = {
	id: string;
	title: string;
	subtitle: string;
	image: string;
	accent: string;
	background: string;
	location: string;
	duration: string;
	bestFor: string;
	overview: string;
	highlights: string[];
	plan: string[];
	relatedIds: string[];
};

export const NESTED_ZOOM_GROUP_ITEMS: NestedZoomGroupItem[] = [
	{
		id: "nebraska",
		title: "Nebraska",
		subtitle: "Long roads, open sky, quiet pace",
		image: "https://picsum.photos/id/1011/1200/1200",
		accent: "#8ED0FF",
		background: "#09141B",
		location: "Lincoln, Nebraska",
		duration: "3 days",
		bestFor: "Road trip reset",
		overview:
			"Nebraska is the calmest route in the set. The point of this example is that the same grouped navigation flow can open here, move deeper into a nested screen, and still retarget cleanly if the active destination changes.",
		highlights: ["Platte River drive", "Wide prairie stops", "Early evening grain elevators"],
		plan: ["Day 1: Lincoln arrival and downtown loop", "Day 2: Northbound drive with prairie stops", "Day 3: Sunrise field roads and return"],
		relatedIds: ["sedona", "savannah", "monterey"],
	},
	{
		id: "sedona",
		title: "Sedona",
		subtitle: "Red rock climbs and hard sunset light",
		image: "https://picsum.photos/id/1016/1200/1200",
		accent: "#FFB48A",
		background: "#1A0F0B",
		location: "Sedona, Arizona",
		duration: "4 days",
		bestFor: "Weekend escape",
		overview:
			"Sedona makes the retargeting more obvious because the palette changes immediately. It is useful when you want to test a nested grouped destination that feels visually different after a push.",
		highlights: ["Bell Rock trailhead", "Cathedral overlook", "Late sun canyon drive"],
		plan: ["Day 1: Arrival and lower canyon trail", "Day 2: Sunrise hike and uptown reset", "Day 3: Scenic loop and overlook circuit", "Day 4: Coffee stop and departure"],
		relatedIds: ["aspen", "santa-fe", "nebraska"],
	},
	{
		id: "savannah",
		title: "Savannah",
		subtitle: "Shaded streets and slow evening walks",
		image: "https://picsum.photos/id/1031/1200/1200",
		accent: "#F4C28D",
		background: "#15110F",
		location: "Savannah, Georgia",
		duration: "3 days",
		bestFor: "Walkable city breaks",
		overview:
			"Savannah keeps the same route shape but changes the rhythm completely. That makes it a good candidate for proving that grouped matching is based on the current active member, not the original open.",
		highlights: ["Forsyth morning loop", "Historic square route", "Riverside dinner walk"],
		plan: ["Day 1: Check-in and historic district stroll", "Day 2: Square-hopping route and market lunch", "Day 3: Riverside morning and departure"],
		relatedIds: ["charleston", "monterey", "nebraska"],
	},
	{
		id: "monterey",
		title: "Monterey",
		subtitle: "Cool coast air and marine blues",
		image: "https://picsum.photos/id/1040/1200/1200",
		accent: "#7FE1E2",
		background: "#08171A",
		location: "Monterey, California",
		duration: "2 days",
		bestFor: "Scenic coast stops",
		overview:
			"Monterey keeps the grouped flow coastal and calm. In practice it gives this example a very different source and destination surface while the route contract stays unchanged.",
		highlights: ["Cannery Row dawn walk", "17-Mile Drive pull-offs", "Blue-hour harbor stop"],
		plan: ["Day 1: Coastal check-in and aquarium block", "Day 2: Scenic drive, lunch stop, and exit"],
		relatedIds: ["savannah", "charleston", "sedona"],
	},
	{
		id: "aspen",
		title: "Aspen",
		subtitle: "High-altitude mornings and cold light",
		image: "https://picsum.photos/id/1039/1200/1200",
		accent: "#B7D7FF",
		background: "#0B121A",
		location: "Aspen, Colorado",
		duration: "4 days",
		bestFor: "Mountain itineraries",
		overview:
			"Aspen is here because it makes the source retarget path obvious on dismiss. If you open Sedona, move deeper, switch to Aspen, and dismiss, the grouped system should now care about Aspen.",
		highlights: ["Maroon Bells sunrise", "Aspen grove trail", "Late afternoon ridge drive"],
		plan: ["Day 1: Arrival and mountain town loop", "Day 2: Alpine hike and lunch stop", "Day 3: Scenic drive and river trail", "Day 4: Coffee, gear pickup, departure"],
		relatedIds: ["sedona", "santa-fe", "nebraska"],
	},
	{
		id: "santa-fe",
		title: "Santa Fe",
		subtitle: "Adobe walls and warm dry color",
		image: "https://picsum.photos/id/1025/1200/1200",
		accent: "#F2A56F",
		background: "#18100D",
		location: "Santa Fe, New Mexico",
		duration: "3 days",
		bestFor: "Design-heavy trips",
		overview:
			"Santa Fe rounds out the western part of the set. It works well for nested grouped testing because the imagery and accent feel distinct without requiring a different screen structure.",
		highlights: ["Canyon Road loop", "Old town adobe blocks", "Evening courtyard dinner"],
		plan: ["Day 1: Plaza arrival and gallery walk", "Day 2: Museum route and late dinner", "Day 3: Short ridge drive and checkout"],
		relatedIds: ["sedona", "aspen", "savannah"],
	},
	{
		id: "charleston",
		title: "Charleston",
		subtitle: "Pastel facades and coastal humidity",
		image: "https://picsum.photos/id/1020/1200/1200",
		accent: "#F3D7B3",
		background: "#15110E",
		location: "Charleston, South Carolina",
		duration: "2 days",
		bestFor: "Food and architecture",
		overview:
			"Charleston is the softer counterpart to Savannah. It is useful here because it proves the grouped nested flow can jump laterally between similar destinations without losing the current active target.",
		highlights: ["Rainbow Row pass", "King Street lunch stop", "Harbor breeze evening walk"],
		plan: ["Day 1: Historic district and harbor walk", "Day 2: Brunch route and final architecture pass"],
		relatedIds: ["savannah", "monterey", "nebraska"],
	},
];

export const activeNestedZoomGroupId = makeMutable(
	NESTED_ZOOM_GROUP_ITEMS[0].id,
);

export const getNestedZoomGroupItemById = (id: string | undefined) => {
	if (!id) {
		return NESTED_ZOOM_GROUP_ITEMS[0];
	}

	return (
		NESTED_ZOOM_GROUP_ITEMS.find((item) => item.id === id) ??
		NESTED_ZOOM_GROUP_ITEMS[0]
	);
};

export const getNestedZoomGroupRelatedItems = (id: string | undefined) => {
	const item = getNestedZoomGroupItemById(id);
	return item.relatedIds
		.map((relatedId) =>
			NESTED_ZOOM_GROUP_ITEMS.find((candidate) => candidate.id === relatedId),
		)
		.filter((candidate): candidate is NestedZoomGroupItem => Boolean(candidate));
};
