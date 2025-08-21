import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { createTransitionAwareComponent } from "../create-transition-aware-component";

const TransitionView = createTransitionAwareComponent(View);

let LazyMaskedView = View;

try {
	LazyMaskedView = require("@react-native-masked-view/masked-view").default;
} catch (_) {
	// noop
}

const MASK_STYLE_ID = "root-masked-view";
const CONTAINER_STYLE_ID = "root-container-view";

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
	rootMask: {
		backgroundColor: "white",
	},
	rootContainer: {
		flex: 1,
	},
});
