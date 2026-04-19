import { makeMutable } from "react-native-reanimated";
import { GALLERY_ITEMS } from "../gallery/constants";

export { GALLERY_ITEMS };
export type { GalleryItem } from "../gallery/constants";

export const HORIZONTAL_GALLERY_GROUP = "gallery-horizontal";
export const activeHorizontalGalleryId = makeMutable(GALLERY_ITEMS[0].id);
