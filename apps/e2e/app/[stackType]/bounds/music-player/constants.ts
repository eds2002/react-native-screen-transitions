export type PlaylistItem = {
	id: string;
	title: string;
	songCount: number;
	duration: string;
	curator: string;
	image: string;
	bgColor: string;
	surfaceColor: string;
	accent: string;
	description: string;
	tracks: {
		title: string;
		artist: string;
		length: string;
	}[];
};

export const PLAYLIST_ITEMS: PlaylistItem[] = [
	{
		id: "midnight-cruise",
		title: "Midnight Cruise",
		songCount: 28,
		duration: "1 hr 47 min",
		curator: "Night Shift FM",
		image: "https://picsum.photos/id/1062/1200/1200",
		bgColor: "#0B1018",
		surfaceColor: "#131C2A",
		accent: "#73E0FF",
		description:
			"Neon-lit synth pop and night-drive cuts sequenced to feel like a city skyline sliding past the window. Starts glossy, gets heavier, then lands soft for the last stretch.",
		tracks: [
			{ title: "Soft Exit", artist: "Vera North", length: "3:48" },
			{ title: "After 2AM", artist: "Signal Youth", length: "4:11" },
			{ title: "Headlights", artist: "The Parallel", length: "3:36" },
			{ title: "Chrome Heart", artist: "Summer Static", length: "4:24" },
			{ title: "Sleepwalk FM", artist: "Blue Driver", length: "5:02" },
		],
	},
	{
		id: "velvet-hours",
		title: "Velvet Hours",
		songCount: 19,
		duration: "1 hr 9 min",
		curator: "Room Tone",
		image: "https://picsum.photos/id/1011/1200/1200",
		bgColor: "#161111",
		surfaceColor: "#231919",
		accent: "#FF8E72",
		description:
			"A slow-bloom mix of smoky soul, brushed percussion, and late-night piano. Built for dim lamps, low voices, and letting a room exhale.",
		tracks: [
			{ title: "Wine Dark", artist: "Mina Vale", length: "3:21" },
			{ title: "Ribbons", artist: "Theo Gold", length: "4:03" },
			{ title: "Blue Room", artist: "Elara", length: "3:57" },
			{ title: "Slow Burn", artist: "June Harbor", length: "4:28" },
			{ title: "Nocturne 12", artist: "Aster Lane", length: "5:14" },
		],
	},
	{
		id: "poolside-bounce",
		title: "Poolside Bounce",
		songCount: 34,
		duration: "2 hr 3 min",
		curator: "Sunblock Radio",
		image: "https://picsum.photos/id/1025/1200/1200",
		bgColor: "#0D1614",
		surfaceColor: "#13221E",
		accent: "#B7FF72",
		description:
			"Warm-weather percussion, rubbery bass, and bright hooks. This one stays playful all the way through and works best with the windows open.",
		tracks: [
			{ title: "Palm Reader", artist: "Cassette Club", length: "3:13" },
			{ title: "Heat Check", artist: "Nico Bloom", length: "3:47" },
			{ title: "Lime Soda", artist: "Motel Kids", length: "2:58" },
			{ title: "Dive Bell", artist: "Sora Bay", length: "4:12" },
			{ title: "Boardwalk Glow", artist: "Hotel Flora", length: "3:40" },
		],
	},
	{
		id: "signal-loss",
		title: "Signal Loss",
		songCount: 22,
		duration: "1 hr 21 min",
		curator: "Tape Archive",
		image: "https://picsum.photos/id/1035/1200/1200",
		bgColor: "#101114",
		surfaceColor: "#181B20",
		accent: "#FFC857",
		description:
			"Cracked drum machines, tape haze, and off-kilter melodic loops. The sequencing leans gritty without getting muddy, with just enough pulse to keep it moving.",
		tracks: [
			{ title: "Dead Channel", artist: "Hollow Palm", length: "4:01" },
			{ title: "Offset", artist: "Lumen Grey", length: "3:34" },
			{ title: "Subcarrier", artist: "Static Lake", length: "4:43" },
			{ title: "Tape Bloom", artist: "Sable Unit", length: "3:18" },
			{ title: "Warm Noise", artist: "Filter Field", length: "4:37" },
		],
	},
];

export const getPlaylistById = (id: string | undefined) => {
	if (!id) return PLAYLIST_ITEMS[0];
	return PLAYLIST_ITEMS.find((item) => item.id === id) ?? PLAYLIST_ITEMS[0];
};
