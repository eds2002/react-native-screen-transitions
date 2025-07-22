import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";

export default function Single() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Screen 2/2-1" canGoBack />
		</Transition.View>
	);
}
