import { memo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
	BlankStackProvider,
	useBlankStackStore,
} from "../../providers/stack/blank-stack.provider";
import type { BlankStackProviderProps } from "../../types/providers/blank-stack-provider.types";
import { ActivityContainer, ActivityScreen } from "../activity";
import { PortalProvider } from "../boundary/portal";
import { Overlay } from "../overlay";
import { BlankStackLifecycle } from "./lifecycle/blank-stack";
import { Screen } from "./screen";

interface RouteKeyProps {
	routeKey: string;
}

// Keep the render subscription inside the activity boundary so it can be paused.
const BlankSceneContent = memo(function BlankSceneContent({
	routeKey,
}: RouteKeyProps) {
	const render = useBlankStackStore(
		(store) => store?.scenesByKey[routeKey]?.descriptor.render,
	);
	return render?.();
});

const BlankSceneRow = memo(function BlankSceneRow({ routeKey }: RouteKeyProps) {
	return (
		<ActivityScreen routeKey={routeKey}>
			<Screen routeKey={routeKey} lifecycle={BlankStackLifecycle}>
				<BlankSceneContent routeKey={routeKey} />
			</Screen>
		</ActivityScreen>
	);
});

const StackViewContent = memo(function StackViewContent() {
	const routeKeys = useBlankStackStore((store) => store?.routeKeys);
	return (
		<PortalProvider>
			<Overlay.Float />
			<ActivityContainer>
				{routeKeys.map((routeKey) => (
					<BlankSceneRow key={routeKey} routeKey={routeKey} />
				))}
			</ActivityContainer>
		</PortalProvider>
	);
});

export const BlankStackView = memo(function BlankStackView({
	state,
	navigation,
	descriptors,
}: BlankStackProviderProps) {
	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProvider>
				<BlankStackProvider
					state={state}
					navigation={navigation}
					descriptors={descriptors}
				>
					<StackViewContent />
				</BlankStackProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
});

const styles = StyleSheet.create({ container: { flex: 1 } });
