export const REELS_GROUP = "reels";

export const reelId = (index: number) => `reel-${index}`;

export type Reel = {
	id: string;
	title: string;
	author: string;
	duration: string;
	source: string;
};

// Free direct-MP4 sources, verified reachable: Pexels video CDN (free stock,
// no API key for direct files) and test-videos.co.uk. The old Google
// gtv-videos-bucket samples now return 403.
export const REELS: Reel[] = [
	{
		id: "portrait",
		title: "Golden hour",
		author: "@pexels",
		duration: "0:14",
		source:
			"https://videos.pexels.com/video-files/2499611/2499611-hd_1080_1920_30fps.mp4",
	},
	{
		id: "shore",
		title: "Shoreline",
		author: "@pexels",
		duration: "0:22",
		source:
			"https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_24fps.mp4",
	},
	{
		id: "drift",
		title: "Drift",
		author: "@pexels",
		duration: "0:09",
		source:
			"https://videos.pexels.com/video-files/857195/857195-hd_1280_720_25fps.mp4",
	},
	{
		id: "haze",
		title: "Haze",
		author: "@pexels",
		duration: "0:31",
		source:
			"https://videos.pexels.com/video-files/1526909/1526909-hd_1920_1080_24fps.mp4",
	},
	{
		id: "motion",
		title: "Motion study",
		author: "@pexels",
		duration: "0:17",
		source:
			"https://videos.pexels.com/video-files/3195394/3195394-hd_1280_720_25fps.mp4",
	},
	{
		id: "bunny",
		title: "Big Buck Bunny",
		author: "@blender",
		duration: "0:26",
		source:
			"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4",
	},
];
