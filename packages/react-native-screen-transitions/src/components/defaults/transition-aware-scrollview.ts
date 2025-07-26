import { ScrollView } from "react-native";
import { createTransitionAwareComponent } from "../transition/create-transition-aware-component";

const TransitionAwareScrollView = createTransitionAwareComponent(ScrollView, {
	isScrollable: true,
});

export default TransitionAwareScrollView;
