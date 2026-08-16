import { Activity, type ReactNode } from "react";
import {
	type HostComponent,
	NativeComponentRegistry,
	type ViewProps,
} from "react-native";

export type ActivityViewMode = "normal" | "inert" | "paused";

interface ActivityViewProps {
	children: ReactNode;
	mode: ActivityViewMode;
	visible: boolean;
}

/**
 * Separates React lifecycle activity from native presentation.
 *
 * A paused Activity tears down effects and deprioritizes updates. Keeping an
 * explicit display value on its host view lets `pause` preserve the last paint,
 * while `hide` can pause the same subtree and remove its presentation.
 */
export function ActivityView({ children, mode, visible }: ActivityViewProps) {
	const activityMode = mode === "paused" ? "hidden" : "visible";
	const display = visible ? "contents" : "none";
	const { ContentView, PaintView } = getNativeActivityViews();

	return (
		<Activity mode={activityMode}>
			<ContentView style={{ display: "contents" }}>
				<PaintView style={{ display }}>{children}</PaintView>
			</ContentView>
		</Activity>
	);
}

const ACTIVITY_CONTENT_STYLE: Record<
	string,
	true | { process?: (value: unknown) => unknown }
> = {
	display: {
		// Activity writes display:none to its nearest host child. Preserve the
		// native paint while React pauses the subtree.
		process: () => "contents",
	},
};

const ACTIVITY_PAINT_STYLE: Record<
	string,
	true | { process?: (value: unknown) => unknown }
> = {
	display: {
		process: (value: unknown) => (value === "none" ? "none" : "contents"),
	},
};

const ACTIVITY_CONTENT_VIEW_CONFIG = {
	uiViewClassName: "RCTView",
	validAttributes: { style: ACTIVITY_CONTENT_STYLE },
};

const ACTIVITY_PAINT_VIEW_CONFIG = {
	uiViewClassName: "RCTView",
	validAttributes: { style: ACTIVITY_PAINT_STYLE },
};

type NativeActivityViewProps = Omit<ViewProps, "style"> & {
	style?: { display?: "contents" | "none" };
};

let nativeActivityViews:
	| {
			ContentView: HostComponent<NativeActivityViewProps>;
			PaintView: HostComponent<NativeActivityViewProps>;
	  }
	| undefined;

function getNativeActivityViews() {
	if (!nativeActivityViews) {
		nativeActivityViews = {
			ContentView: NativeComponentRegistry.get<NativeActivityViewProps>(
				"ScreenTransitionsActivityContentView",
				() => ACTIVITY_CONTENT_VIEW_CONFIG,
			),
			PaintView: NativeComponentRegistry.get<NativeActivityViewProps>(
				"ScreenTransitionsActivityPaintView",
				() => ACTIVITY_PAINT_VIEW_CONFIG,
			),
		};
	}

	return nativeActivityViews;
}
