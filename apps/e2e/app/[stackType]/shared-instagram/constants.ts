export const INSTAGRAM_IMAGES = [
	{ id: "1015", url: "https://picsum.photos/id/1015/600/900" },
	{ id: "1025", url: "https://picsum.photos/id/1025/600/900" },
	{ id: "1035", url: "https://picsum.photos/id/1035/600/900" },
	{ id: "1045", url: "https://picsum.photos/id/1045/600/900" },
	{ id: "1055", url: "https://picsum.photos/id/1055/600/900" },
	{ id: "1065", url: "https://picsum.photos/id/1065/600/900" },
	{ id: "1075", url: "https://picsum.photos/id/1075/600/900" },
	{ id: "1085", url: "https://picsum.photos/id/1085/600/900" },
	{ id: "1095", url: "https://picsum.photos/id/1095/600/900" },
] as const;

export const getInstagramImage = (id: string | undefined) => {
	if (!id) {
		return INSTAGRAM_IMAGES[0];
	}

	return INSTAGRAM_IMAGES.find((image) => image.id === id) ?? INSTAGRAM_IMAGES[0];
};
