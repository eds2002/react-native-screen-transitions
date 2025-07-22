import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Transition from "react-native-screen-transitions";
import { GroupA } from "./GroupA";
import { GroupB } from "./GroupB";

const GroupAStack = createNativeStackNavigator();

export function GroupANavigator() {
	return (
		<Transition.View style={{ borderRadius: 36, overflow: "hidden" }}>
			<GroupAStack.Navigator screenOptions={{ headerShown: false }}>
				<GroupAStack.Screen name="GroupA" component={GroupA} />
				<GroupAStack.Screen name="GroupB" component={GroupB} />
			</GroupAStack.Navigator>
		</Transition.View>
	);
}
