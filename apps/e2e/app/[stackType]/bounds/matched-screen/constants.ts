export const MATCHED_SCREEN_BOUNDARY_GROUP = "video-handoff";
export const MATCHED_SCREEN_GRID_WIDTH = 292;
export const MATCHED_SCREEN_SQUARE_SIZE = 140;
export const MATCHED_SCREEN_WIDE_ASPECT_RATIO = 16 / 9;
export const MATCHED_SCREEN_DETAIL_WIDTH = 328;

export const MATCHED_SCREEN_VIDEOS = [
	{
		id: "A",
		aspectRatio: 1,
		title: "Turtle",
		source:
			"https://res.cloudinary.com/demo/video/upload/q_auto/cld-sample-video.mp4",
	},
	{
		id: "B",
		aspectRatio: 1,
		title: "Dog",
		source:
			"https://res.cloudinary.com/demo/video/upload/so_0.5,eo_4.5,q_auto,vc_h264/dog.mp4",
	},
	{
		id: "C",
		aspectRatio: 1,
		title: "Rowing",
		source: "https://res.cloudinary.com/demo/video/upload/q_auto/rafting.mp4",
	},
	{
		id: "D",
		aspectRatio: 1,
		title: "Elephant",
		source: "https://res.cloudinary.com/demo/video/upload/q_auto/elephants.mp4",
	},
	{
		id: "E",
		aspectRatio: MATCHED_SCREEN_WIDE_ASPECT_RATIO,
		title: "Island",
		source:
			"https://res.cloudinary.com/demo/video/upload/q_auto/glide-over-coastal-beach.mp4",
	},
] as const;

export const MATCHED_SCREEN_SQUARE_VIDEOS = MATCHED_SCREEN_VIDEOS.filter(
	({ aspectRatio }) => aspectRatio === 1,
);
export const MATCHED_SCREEN_WIDE_VIDEO = MATCHED_SCREEN_VIDEOS[4];

if (
	MATCHED_SCREEN_WIDE_VIDEO.aspectRatio !== MATCHED_SCREEN_WIDE_ASPECT_RATIO
) {
	throw new Error("The video handoff demo requires a 16:9 example.");
}

export type MatchedScreenVideo = (typeof MATCHED_SCREEN_VIDEOS)[number];
export type MatchedScreenVideoId = MatchedScreenVideo["id"];
