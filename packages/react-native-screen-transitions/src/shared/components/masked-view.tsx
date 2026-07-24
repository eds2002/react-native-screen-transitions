import {
	I18nManager,
	type StyleProp,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import { CONTAINER_STYLE_ID, MASK_STYLE_ID } from "../constants";
import { createTransitionAwareComponent } from "./create-transition-aware-component";

const TransitionView = createTransitionAwareComponent(View);

let LazyMaskedView = View;

try {
	LazyMaskedView = require("@react-native-masked-view/masked-view").default;
} catch (_) {
	// noop
}

/**
 * @deprecated Use `navigationMaskEnabled` with the navigation mask style IDs
 * instead.
 */
export default function MaskedView({
	children,
	style: userStyles = {},
}: {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}) {
	if (LazyMaskedView === View) {
		return children;
	}

	return (
		<LazyMaskedView
			style={styles.root}
			// @ts-expect-error
			maskElement={
				<TransitionView styleId={MASK_STYLE_ID} style={styles.rootMask} />
			}
		>
			<TransitionView
				styleId={CONTAINER_STYLE_ID}
				style={[styles.rootContainer, userStyles]}
			>
				{children}
			</TransitionView>
		</LazyMaskedView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	// The mask rect's translate math assumes a physical top-left base. Under
	// native RTL a fixed-width flex child anchors to the right edge, so pin it
	// to the physical left (`end` = left edge in RTL).
	rootMask: I18nManager.isRTL
		? {
				backgroundColor: "white",
				end: 0,
				position: "absolute",
				top: 0,
			}
		: {
				backgroundColor: "white",
			},
	rootContainer: {
		flex: 1,
	},
});
