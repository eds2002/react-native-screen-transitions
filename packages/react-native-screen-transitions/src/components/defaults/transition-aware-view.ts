import { View } from "react-native";
import { createTransitionAwareComponent } from "../transition/create-transition-aware-component";

const TransitionAwareView = createTransitionAwareComponent(View);

export default TransitionAwareView;
