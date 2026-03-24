import { makeMutable } from "react-native-reanimated";

export const GALLERY_GROUP = "gallery";

export type GalleryItem = {
	id: string;
	uri: string;
	width: number;
	height: number;
};

const createGalleryItem = (
	id: string,
	photoId: number,
	width: number,
	height: number,
): GalleryItem => ({
	id,
	uri: `https://picsum.photos/id/${String(photoId)}/${String(width)}/${String(
		height,
	)}`,
	width,
	height,
});

export const GALLERY_ITEMS: GalleryItem[] = [
	createGalleryItem("mountains", 29, 800, 1200),
	createGalleryItem("lake", 16, 800, 540),
	createGalleryItem("forest", 15, 800, 540),
	createGalleryItem("coast", 1015, 800, 1200),
	createGalleryItem("desert", 240, 800, 640),
	createGalleryItem("cabin", 164, 800, 1100),
	createGalleryItem("road", 167, 800, 540),
	createGalleryItem("autumn", 119, 800, 1000),
	createGalleryItem("bridge", 84, 800, 600),
	createGalleryItem("waterfall", 1035, 800, 1200),
	createGalleryItem("cliffs", 1025, 800, 920),
	createGalleryItem("shoreline", 1016, 800, 540),
	createGalleryItem("mist", 1003, 800, 1180),
	createGalleryItem("summit", 1002, 800, 1040),
	createGalleryItem("field", 1020, 800, 720),
	createGalleryItem("pier", 1011, 800, 560),
	createGalleryItem("valley", 1043, 800, 1080),
	createGalleryItem("palms", 1019, 800, 640),
	createGalleryItem("snow", 1036, 800, 1160),
	createGalleryItem("sunrise", 1056, 800, 620),
	createGalleryItem("river", 1049, 800, 980),
	createGalleryItem("boardwalk", 1067, 800, 620),
	createGalleryItem("dunes", 1074, 800, 1120),
	createGalleryItem("island", 1076, 800, 700),
	createGalleryItem("trail", 1080, 800, 540),
	createGalleryItem("glacier", 1084, 800, 1240),
	createGalleryItem("lookout", 1081, 800, 860),
	createGalleryItem("harbor", 1069, 800, 680),
	createGalleryItem("grove", 1059, 800, 940),
	createGalleryItem("peaks", 1040, 800, 1180),
];

export const activeGalleryId = makeMutable(GALLERY_ITEMS[0].id);
