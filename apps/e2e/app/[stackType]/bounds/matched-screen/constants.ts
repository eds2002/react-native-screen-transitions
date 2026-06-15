export const MATCHED_SCREEN_YOUNGBOY_ID = "matched-screen-youngboy";
export const MATCHED_SCREEN_SUBWAY_ID = "matched-screen-subway";
export const MATCHED_SCREEN_LEG_ID = "matched-screen-leg";
export const MATCHED_SCREEN_SICK_ID = "matched-screen-sick";

export const MATCHED_SCREEN_VIDEOS = [
	{
		id: MATCHED_SCREEN_YOUNGBOY_ID,
		title: "Youngboy",
		subtitle: "Landscape source",
		aspectRatio: 16 / 9,
		playsAudio: true,
		source: require("../../../../assets/videos/youngboy.mp4"),
	},
	{
		id: MATCHED_SCREEN_SUBWAY_ID,
		title: "Subway",
		subtitle: "Portrait source",
		aspectRatio: 9 / 16,
		playsAudio: true,
		source: require("../../../../assets/videos/subway.mp4"),
	},
	{
		id: MATCHED_SCREEN_LEG_ID,
		title: "Leg",
		subtitle: "Portrait source",
		aspectRatio: 9 / 16,
		playsAudio: false,
		source: require("../../../../assets/videos/leg.mp4"),
	},
	{
		id: MATCHED_SCREEN_SICK_ID,
		title: "Sick",
		subtitle: "Portrait source",
		aspectRatio: 9 / 16,
		playsAudio: false,
		source: require("../../../../assets/videos/sick.mp4"),
	},
] as const;
