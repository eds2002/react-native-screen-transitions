export const MATCHED_SCREEN_BOUNDARY_GROUP = "video-handoff";
export const MATCHED_SCREEN_ASPECT_RATIO = 16 / 9;
export const MATCHED_SCREEN_DETAIL_WIDTH = 328;

export const MATCHED_SCREEN_VIDEOS = [
	{
		id: "A",
		title: "Turtle",
		source:
			"https://res.cloudinary.com/demo/video/upload/q_auto/cld-sample-video.mp4",
	},
	{
		id: "B",
		title: "Dog",
		source:
			"https://res.cloudinary.com/demo/video/upload/so_0.5,eo_4.5,q_auto,vc_h264/dog.mp4",
	},
	{
		id: "C",
		title: "Rowing",
		source: "https://res.cloudinary.com/demo/video/upload/q_auto/rafting.mp4",
	},
	{
		id: "D",
		title: "Elephant",
		source: "https://res.cloudinary.com/demo/video/upload/q_auto/elephants.mp4",
	},
	{
		id: "E",
		title: "Island",
		source:
			"https://res.cloudinary.com/demo/video/upload/q_auto/glide-over-coastal-beach.mp4",
	},
] as const;

export type MatchedScreenVideo = (typeof MATCHED_SCREEN_VIDEOS)[number];
export type MatchedScreenVideoId = MatchedScreenVideo["id"];
