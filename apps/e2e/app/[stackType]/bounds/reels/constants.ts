import { makeMutable } from "react-native-reanimated";

export const REELS_GROUP = "reels";

const REEL_VIDEO_SOURCES = [
	require("../../../../assets/videos/1.mp4"),
	require("../../../../assets/videos/2.mp4"),
	require("../../../../assets/videos/3.mp4"),
	require("../../../../assets/videos/4.mp4"),
	require("../../../../assets/videos/5.mp4"),
	require("../../../../assets/videos/6.mp4"),
	require("../../../../assets/videos/7.mp4"),
	null,
	require("../../../../assets/videos/9.mp4"),
] as const;

const REEL_THUMBNAIL_SOURCES = [
	require("../../../../assets/videos/thumbnails/1.webp"),
	require("../../../../assets/videos/thumbnails/2.webp"),
	require("../../../../assets/videos/thumbnails/3.webp"),
	require("../../../../assets/videos/thumbnails/4.webp"),
	require("../../../../assets/videos/thumbnails/5.webp"),
	require("../../../../assets/videos/thumbnails/6.webp"),
	require("../../../../assets/videos/thumbnails/7.webp"),
	require("../../../../assets/videos/thumbnails/8.webp"),
	require("../../../../assets/videos/thumbnails/9.webp"),
] as const;

export const REEL_ITEMS = Array.from({ length: 9 }, (_, index) => ({
	id: `reel-${index + 1}`,
	profileName: [
		"Northside Slice",
		"Amari Studio",
		"City Frames",
		"Paper Plants",
		"Mizu House",
		"After Hours FM",
		"Summer Objects",
		"Night Shift Lab",
		"Mono Archive",
	][index],
	handle: [
		"northside.slice",
		"amari.studio",
		"city.frames",
		"paper.plants",
		"mizu.house",
		"after.hours.fm",
		"summer.objects",
		"night.shift.lab",
		"mono.archive",
	][index],
	caption: [
		"First clip in the set while the room is still waking up.",
		"Soft light, handheld camera, and an almost-too-clean kitchen.",
		"Concrete, glass, and one perfect warm reflection.",
		"Desk reset before the rain starts.",
		"Tea pour, steam, and a room that sounds expensive.",
		"Late-night set with the room lights all the way down.",
		"Poolside shadows with zero urgency.",
		"Testing the last frame before the drop.",
		"Archive clip with a little too much grain.",
	][index],
	videoSource: REEL_VIDEO_SOURCES[index] ?? undefined,
	thumbnailSource: REEL_THUMBNAIL_SOURCES[index],
}));

export const selectedId = makeMutable(REEL_ITEMS[0].id);
