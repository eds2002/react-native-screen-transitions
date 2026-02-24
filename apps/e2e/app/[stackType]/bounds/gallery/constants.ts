import { makeMutable } from "react-native-reanimated";

export const GALLERY_GROUP = "gallery";

export type GalleryItem = {
	id: string;
	uri: string;
	width: number;
	height: number;
};

export const GALLERY_ITEMS: GalleryItem[] = [
	{
		id: "mountains",
		uri: "https://picsum.photos/id/29/800/1200",
		width: 800,
		height: 1200,
	},
	{
		id: "lake",
		uri: "https://picsum.photos/id/16/800/540",
		width: 800,
		height: 540,
	},
	{
		id: "forest",
		uri: "https://picsum.photos/id/15/800/540",
		width: 800,
		height: 540,
	},
	{
		id: "coast",
		uri: "https://picsum.photos/id/1015/800/1200",
		width: 800,
		height: 1200,
	},
	{
		id: "desert",
		uri: "https://picsum.photos/id/240/800/640",
		width: 800,
		height: 640,
	},
	{
		id: "cabin",
		uri: "https://picsum.photos/id/164/800/1100",
		width: 800,
		height: 1100,
	},
	{
		id: "road",
		uri: "https://picsum.photos/id/167/800/540",
		width: 800,
		height: 540,
	},
	{
		id: "autumn",
		uri: "https://picsum.photos/id/119/800/1000",
		width: 800,
		height: 1000,
	},
	{
		id: "bridge",
		uri: "https://picsum.photos/id/84/800/600",
		width: 800,
		height: 600,
	},
	{
		id: "waterfall",
		uri: "https://picsum.photos/id/1035/800/1200",
		width: 800,
		height: 1200,
	},
];

export const activeGalleryId = makeMutable(GALLERY_ITEMS[0].id);
