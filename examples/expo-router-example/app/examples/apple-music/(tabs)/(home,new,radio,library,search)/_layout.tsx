import { useMemo } from "react";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

const Layout = ({ segment }: { segment: string }) => {
	const rootScreen = useMemo(() => {
		switch (segment) {
			case "(home)":
				return (
					<Stack.Screen
						name="index"
						options={{
							title: "Home",
							contentStyle: { backgroundColor: "white" },
							headerShadowVisible: false,
							headerLargeTitle: false,
							headerShown: true,
							headerBlurEffect: "light",
							headerTransparent: true,
						}}
					/>
				);
			case "(new)":
				return (
					<Stack.Screen
						name="new"
						options={{ title: "New", headerShown: false }}
					/>
				);
			case "(radio)":
				return (
					<Stack.Screen
						name="radio"
						options={{ title: "Radio", headerShown: false }}
					/>
				);
			case "(library)":
				return (
					<Stack.Screen
						name="library"
						options={{ title: "Library", headerShown: false }}
					/>
				);
			case "(search)":
				return (
					<Stack.Screen
						name="search"
						options={{ title: "Search", headerShown: false }}
					/>
				);
		}
	}, [segment]);

	return (
		<Stack>
			{rootScreen}
			<Stack.Screen
				name="[id]"
				options={{
					...Transition.presets.SharedAppleMusic(),
				}}
			/>
		</Stack>
	);
};

export default Layout;
