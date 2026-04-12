import { Activity, type ReactNode } from "react";
import {
	type HostComponent,
	NativeComponentRegistry,
	Platform,
	type StyleProp,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import {
	ACTIVITY_CONTENTS_DISPLAY,
	POINTER_EVENTS_BOX_NONE,
	POINTER_EVENTS_NONE,
} from "../constants";
import { useScreenHostContext } from "../screen-host.provider";

interface ScreenHostActivityProps {
	children: ReactNode;
}

/**
 * Inspired by React Navigation's JS stack activity wrapper:
 * - https://unpkg.com/@react-navigation/elements@3.0.0-alpha.20/lib/module/ActivityView.js
 *
 * One intentional experimental change here is that inactive screens should
 * pause React effects without automatically hiding their paint with
 * `display: none`. Keeping paused screens painted gives us room for more
 * advanced `stackProgress` transitions. We may eventually split this
 * into explicit behaviors such as "pause and keep paint" vs "pause and hide
 * paint", but for now we are intentionally experimenting with the painted path.
 */
export const ScreenHostActivity = ({ children }: ScreenHostActivityProps) => {
	const { activityMode, isInert, contentStyle } = useScreenHostContext();

	if (Platform.OS === "web") {
		return (
			<ActivityContainer inert={isInert} style={contentStyle}>
				{children}
			</ActivityContainer>
		);
	}

	return (
		<Activity mode={activityMode}>
			<ActivityContentView style={{ display: ACTIVITY_CONTENTS_DISPLAY }}>
				{children}
			</ActivityContentView>
		</Activity>
	);
};

interface ActivityContainerProps {
	inert: boolean;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}

const ActivityContainer = ({
	inert,
	style,
	children,
}: ActivityContainerProps) => {
	return (
		<View
			aria-hidden={inert}
			pointerEvents={inert ? POINTER_EVENTS_NONE : POINTER_EVENTS_BOX_NONE}
			style={style}
			collapsable={false}
		>
			{children}
		</View>
	);
};

const ACTIVITY_CONTENT_STYLE: Record<
	string,
	true | { process?: (value: unknown) => unknown }
> = {
	display: {
		// React Activity hides its subtree with display:none when effects are paused.
		// We remap the wrapper to display:contents so inactive screens can stay painted.
		process: () => ACTIVITY_CONTENTS_DISPLAY,
	},
};

const ACTIVITY_CONTENT_VIEW_CONFIG = {
	uiViewClassName: "RCTView",
	validAttributes: {
		style: ACTIVITY_CONTENT_STYLE,
	},
};

type ActivityContentViewProps = Omit<ViewProps, "style"> & {
	style?:
		| {
				display?: typeof ACTIVITY_CONTENTS_DISPLAY | undefined;
		  }
		| undefined;
};

const ActivityContentView: HostComponent<ActivityContentViewProps> =
	NativeComponentRegistry.get<ActivityContentViewProps>(
		"ScreenTransitionsActivityContentView",
		() => ACTIVITY_CONTENT_VIEW_CONFIG,
	);
