import {
	createStaticNavigation,
	type StaticParamList,
	type StaticScreenProps,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { withScreenTransitions } from "..";

const Home = () => null;
const Detail = (_props: StaticScreenProps<{ id: string }>) => null;
const createStack = withScreenTransitions(createNativeStackNavigator);
const Dynamic = createStack<{ Home: undefined; Detail: { id: string } }>();
const dynamicScreen = (
	<Dynamic.Screen
		name="Detail"
		component={Detail}
		options={({ route, navigation }) => {
			const id: string = route.params.id;
			navigation.navigate("Detail", { id });
			navigation.push("Detail", { id });
			// @ts-expect-error Stack actions keep their route params.
			navigation.push("Detail", { id: 123 });
			// @ts-expect-error Unknown routes remain invalid.
			navigation.navigate("Missing");
			// @ts-expect-error Param types remain enforced.
			navigation.navigate("Detail", { id: 123 });
			return {
				enableTransitions: true,
				gestureDirection: "pinch-in",
				screenStyleInterpolator: ({ progress }) => ({
					content: { opacity: progress },
				}),
			};
		}}
	/>
);
// @ts-expect-error Unknown screen names remain invalid.
const badScreen = <Dynamic.Screen name="Missing" component={Home} />;
const badOptions = (
	<Dynamic.Screen
		name="Home"
		component={Home}
		options={{
			// @ts-expect-error Invalid gesture directions remain invalid.
			gestureDirection: "nonsense",
		}}
	/>
);

const Nested = createStack({ screens: { Detail } });
const Static = createStack({
	initialRouteName: "Home",
	screenOptions: { enableTransitions: true, gestureDirection: "pinch-in" },
	screens: {
		Home,
		Nested,
		Detail: {
			screen: Detail,
			linking: "detail/:id",
			if: () => true,
			options: {
				enableTransitions: true,
				gestureDirection: "pinch-in",
				screenStyleInterpolator: ({ progress }) => ({
					content: { opacity: progress },
				}),
			},
		},
	},
	groups: {
		Auth: {
			if: () => true,
			screenOptions: { enableTransitions: true, gestureDirection: "pinch-out" },
			screens: {
				Profile: {
					screen: Detail,
					options: {
						enableTransitions: true,
						gestureDirection: "pinch-in",
						screenStyleInterpolator: ({ progress }) => ({
							content: { opacity: progress },
						}),
					},
				},
			},
		},
	},
});
const Navigation = createStaticNavigation(Static);
type Params = StaticParamList<typeof Static>;
const detailParams: Params["Detail"] = { id: "42" };
const profileParams: Params["Profile"] = { id: "42" };
const nestedParams: Params["Nested"] = {
	screen: "Detail",
	params: { id: "42" },
};
// @ts-expect-error Static params remain inferred.
const badParams: Params["Detail"] = { id: 123 };
// @ts-expect-error Group params remain inferred.
const badGroupParams: Params["Profile"] = { id: 123 };
const badNestedParams: Params["Nested"] = {
	screen: "Detail",
	// @ts-expect-error Nested params remain inferred.
	params: { id: 123 },
};
// @ts-expect-error Unknown routes do not appear in the inferred list.
type Missing = Params["Missing"];
declare const missing: Missing;
void missing;
const invalidStatic = createStack({
	screens: {
		Home: {
			screen: Home,
			options: {
				// @ts-expect-error Invalid gesture directions remain invalid in static config.
				gestureDirection: "nonsense",
			},
		},
	},
});
const Existing = withScreenTransitions(
	createNativeStackNavigator<{ Home: undefined }>(),
);
const existingScreen = (
	<Existing.Screen
		name="Home"
		component={Home}
		options={{ enableTransitions: true, gestureDirection: "pinch-in" }}
	/>
);
void [
	dynamicScreen,
	badScreen,
	badOptions,
	Navigation,
	detailParams,
	profileParams,
	nestedParams,
	badParams,
	badGroupParams,
	badNestedParams,
	invalidStatic,
	existingScreen,
];

const createSpecializedStack = withScreenTransitions(
	createNativeStackNavigator<{ Home: undefined }>,
);
const Specialized = createSpecializedStack();
const specializedScreen = <Specialized.Screen name="Home" component={Home} />;
const invalidSpecializedScreen = (
	// @ts-expect-error A factory with an explicit param list retains it by default.
	<Specialized.Screen name="Missing" component={Home} />
);
void [specializedScreen, invalidSpecializedScreen];
