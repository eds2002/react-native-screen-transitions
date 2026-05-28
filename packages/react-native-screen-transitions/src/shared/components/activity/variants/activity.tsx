import { Activity as ReactActivity, type ReactNode } from "react";
import {
	type HostComponent,
	StyleSheet,
	View,
	type ViewProps,
} from "react-native";
import * as NativeComponentRegistry from "react-native/Libraries/NativeComponent/NativeComponentRegistry";

export type ActivityMode = "visible" | "hidden";

const ACTIVITY_CONTENTS_DISPLAY = "contents" as const;

interface ActivityProps {
	children: ReactNode;
	mode: ActivityMode;
	visible: boolean;
}

/**
 * React Activity pauses effects by rendering hidden content. The content view
 * remaps Activity's wrapper to `display: contents` so paused screens can keep
 * their paint when needed for stack transitions.
 */
export const Activity = ({ children, mode, visible }: ActivityProps) => {
	const paintDisplay: "flex" | "none" = visible ? "flex" : "none";

	return (
		<ReactActivity mode={mode}>
			<ActivityContentView
				collapsable={false}
				style={{ display: ACTIVITY_CONTENTS_DISPLAY }}
			>
				<View
					collapsable={false}
					style={[StyleSheet.absoluteFill, { display: paintDisplay }]}
				>
					{children}
				</View>
			</ActivityContentView>
		</ReactActivity>
	);
};

const ACTIVITY_CONTENT_STYLE: Record<
	string,
	true | { process?: (value: unknown) => unknown }
> = {
	display: {
		process: () => ACTIVITY_CONTENTS_DISPLAY,
	},
};

const ACTIVITY_CONTENT_VIEW_CONFIG = {
	uiViewClassName: "RCTView",
	validAttributes: {
		style: ACTIVITY_CONTENT_STYLE,
	},
};

type ActivityViewProps = Omit<ViewProps, "style"> & {
	style?:
		| {
				display?: typeof ACTIVITY_CONTENTS_DISPLAY | "none" | undefined;
		  }
		| undefined;
};

const ActivityContentView: HostComponent<ActivityViewProps> =
	NativeComponentRegistry.get<ActivityViewProps>(
		"ScreenTransitionsActivityContentView",
		() => ACTIVITY_CONTENT_VIEW_CONFIG,
	);
