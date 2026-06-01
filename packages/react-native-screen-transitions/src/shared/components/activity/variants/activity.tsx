import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { Screen } from "react-native-screens";
import { IS_WEB } from "../../../constants";
import { useStack } from "../../../hooks/navigation/use-stack";

export type ActivityState = 0 | 1 | 2;

interface ActivityProps {
	activityState: ActivityState;
	children: ReactNode;
	pointerEvents: ViewProps["pointerEvents"];
	shouldFreeze: boolean;
	visible: boolean;
}

export const Activity = ({
	activityState,
	children,
	pointerEvents,
	shouldFreeze,
	visible,
}: ActivityProps) => {
	const nativeScreenDisabled = useStack((s) => s.flags.DISABLE_NATIVE_SCREENS);
	const Component = IS_WEB || nativeScreenDisabled ? View : Screen;

	return (
		<Component
			style={[styles.screen, !visible && styles.hidden]}
			activityState={activityState}
			shouldFreeze={shouldFreeze}
			pointerEvents={pointerEvents}
			collapsable={false}
		>
			{children}
		</Component>
	);
};

const styles = StyleSheet.create({
	screen: StyleSheet.absoluteFillObject,
	content: StyleSheet.absoluteFillObject,
	hidden: {
		display: "none",
	},
});
