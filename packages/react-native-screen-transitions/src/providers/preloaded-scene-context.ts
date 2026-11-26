import { createContext, useContext } from "react";

export const PreloadedSceneContext = createContext(false);

export function useIsPreloadedScene() {
	return useContext(PreloadedSceneContext);
}
