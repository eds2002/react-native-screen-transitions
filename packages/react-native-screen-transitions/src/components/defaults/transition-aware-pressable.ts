import { Pressable } from "react-native";
import { createTransitionAwareComponent } from "../transition/create-transition-aware-component";

const TransitionAwarePressable = createTransitionAwareComponent(Pressable);

export default TransitionAwarePressable;
