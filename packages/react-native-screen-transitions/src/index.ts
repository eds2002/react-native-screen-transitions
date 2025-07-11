import { Pressable, View } from "react-native";
import { presets, specs } from "./configs";
import { useScreenAnimation } from "./hooks/use-screen-animation";
import { createConfig } from "./utils/create-config";
import { createTransitionComponent } from "./utils/create-transition-component";
import { defaultScreenOptions } from "./utils/default-screen-options";

export default {
	createTransitionComponent,
	View: createTransitionComponent(View),
	Pressable: createTransitionComponent(Pressable),
	createConfig,
	defaultScreenOptions,
	presets,
	specs,
};

export { useScreenAnimation };
