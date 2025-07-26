import { FlatList } from "react-native";
import { createTransitionAwareComponent } from "../transition/create-transition-aware-component";

const TransitionAwareFlatList = createTransitionAwareComponent(FlatList, {
	isScrollable: true,
});

export default TransitionAwareFlatList;
