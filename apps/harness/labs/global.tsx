// @ts-nocheck
/**
 * global: shared bounds across the route tree. The List lives in a nested stack (Home); its cards
 * open screens elsewhere:
 *   gl-card-same     a screen in the same nested stack (the usual case, for comparison)
 *   gl-card-root     a screen on the root stack (the card's own stack is only Home's)
 *   gl-card-sibling  a screen inside a sibling stack (Other > Detail)
 *   gl-card-island   a root screen whose content is its own NavigationContainer (an independent tree)
 * Each opens with a zoom out of its card and closes back onto it (gl-back, or swipe down).
 *
 * Argent loop (open harness://lab/global): tap each card, then gl-back: every open grows out of the
 * card and every close lands on it, with the card hidden while its screen is open.
 */
import {
	NavigationContainer,
	NavigationIndependentTree,
} from "@react-navigation/native";
import { createContext, useContext } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import {
	colorFor,
	createBlankStackNavigator,
	type Lab,
	LabContainer,
	Transition,
} from "./ui";

const Root = createBlankStackNavigator();
const Home = createBlankStackNavigator();
const Other = createBlankStackNavigator();
const Island = createBlankStackNavigator();
// The outer navigation, handed into the independent tree (its own navigation can't reach outer routes).
const OuterNavigation = createContext(null);

// The card's id from the route's params, or from its nested screen's (a container opened onto it).
const zoom = {
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	transitionSpec: Transition.Specs.Zoom,
	screenStyleInterpolator: (props) => {
		"worklet";
		const params = props.active?.route?.params ?? props.current?.route?.params;
		const id = params?.id ?? params?.params?.id;
		if (!id) return {};
		return props.bounds(id).navigation.zoom();
	},
};

const CARDS = [
	{
		id: "same",
		label: "same stack",
		open: (n) => n.push("SameDetail", { id: "same" }),
	},
	{
		id: "root",
		label: "to root",
		open: (n) => n.push("RootDetail", { id: "root" }),
	},
	{
		id: "sibling",
		label: "to sibling",
		open: (n) =>
			n.navigate("Other", {
				screen: "SiblingDetail",
				params: { id: "sibling" },
			}),
	},
	{
		id: "island",
		label: "to independent",
		open: (n) => n.push("IslandHost", { id: "island" }),
	},
];

function List({ navigation }) {
	const { width } = useWindowDimensions();
	const size = (width - 40 - 10) / 2;
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "#111827",
				paddingTop: 110,
				paddingHorizontal: 20,
				gap: 10,
			}}
		>
			<Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>
				List (nested in Home)
			</Text>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
				{CARDS.map((card) => (
					<Transition.Boundary
						key={card.id}
						id={card.id}
						testID={`gl-card-${card.id}`}
						accessibilityLabel={`gl-card-${card.id}`}
						onPress={() => card.open(navigation)}
						style={{
							width: size,
							height: size * 0.8,
							borderRadius: 20,
							backgroundColor: colorFor(`gl${card.id}`),
							justifyContent: "flex-end",
							padding: 12,
						}}
					>
						<Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>
							{card.label}
						</Text>
					</Transition.Boundary>
				))}
			</View>
		</View>
	);
}

function Detail({ navigation, route }) {
	const outer = useContext(OuterNavigation);
	const id = route.params?.id ?? outer?.id;
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: colorFor(`gl${id}`),
				paddingTop: 110,
				paddingHorizontal: 20,
				gap: 12,
			}}
		>
			<Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>
				{route.name}
			</Text>
			<Pressable
				testID="gl-back"
				accessibilityLabel="gl-back"
				onPress={() =>
					(navigation.canGoBack() ? navigation : outer.navigation).goBack()
				}
				style={{
					alignSelf: "flex-start",
					backgroundColor: "#000c",
					paddingHorizontal: 16,
					paddingVertical: 10,
					borderRadius: 14,
				}}
			>
				<Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
			</Pressable>
		</View>
	);
}

function HomeStack() {
	return (
		<Home.Navigator>
			<Home.Screen name="List" component={List} />
			<Home.Screen name="SameDetail" component={Detail} options={zoom} />
		</Home.Navigator>
	);
}

function OtherStack() {
	return (
		<Other.Navigator>
			<Other.Screen name="Hub" component={Detail} />
			<Other.Screen name="SiblingDetail" component={Detail} />
		</Other.Navigator>
	);
}

// A screen of the root stack whose whole content is another NavigationContainer.
function IslandHost({ navigation, route }) {
	return (
		<OuterNavigation.Provider value={{ navigation, id: route.params?.id }}>
			<NavigationIndependentTree>
				<NavigationContainer>
					<Island.Navigator>
						<Island.Screen name="IslandDetail" component={Detail} />
					</Island.Navigator>
				</NavigationContainer>
			</NavigationIndependentTree>
		</OuterNavigation.Provider>
	);
}

function Component() {
	return (
		<LabContainer>
			<Root.Navigator>
				<Root.Screen name="Home" component={HomeStack} />
				<Root.Screen name="RootDetail" component={Detail} options={zoom} />
				<Root.Screen name="Other" component={OtherStack} options={zoom} />
				<Root.Screen name="IslandHost" component={IslandHost} options={zoom} />
			</Root.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "global",
	title: "global",
	covers:
		"Shared bounds across the route tree: a nested card opening a screen on the root stack, in a sibling stack, and in an independent NavigationContainer",
	Component,
};
