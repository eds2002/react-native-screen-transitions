import { useMemo } from "react";
import { Stack } from "@/layouts/stack";

const Layout = ({ segment }: { segment: string }) => {
	const rootScreen = useMemo(() => {
		switch (segment) {
			case "(home)":
				return (
					<Stack.Screen
						name="index"
						options={{ title: "Home", headerShown: false }}
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
					enableTransitions: true,
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: ["vertical", "horizontal"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, activeBoundId }) => {
						"worklet";

						const boundStyles = bounds("id").build();

						const test = bounds({
              
            });

						return {
							[activeBoundId]: boundStyles,
						};
					},
					transitionSpec: {
						open: {
							mass: 1,
							stiffness: 280,
							damping: 30,
						},
						close: {
							mass: 1,
							stiffness: 280,
							damping: 30,
						},
					},
				}}
			/>
		</Stack>
	);
};

export default Layout;
