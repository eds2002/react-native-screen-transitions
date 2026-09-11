import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useBuilderStore } from "../../../../providers/screen/builder";
import { useMotionStore } from "../../../../providers/screen/motion";
import {
	useSlotProps,
	useSlotStyles,
} from "../../../../providers/screen/orchestrator/styles";
import { ScreenFallbackHost } from "../../../boundary/portal/components/boundary-portal/components/host";
import { LayerComponent } from "../helpers/layer-component";
import { useContentLayout } from "../hooks/use-content-layout";
import { Clip } from "./clip";
import { SurfaceLayer } from "./surface";

type Props = {
	children: React.ReactNode;
	pointerEvents: "box-none" | undefined;
	isBackdropActive: boolean;
};

export const ContentLayer = memo(
	({ children, pointerEvents, isBackdropActive }: Props) => {
		const gestureContext = useMotionStore((store) => store.gestures);
		const ContentComponent = useBuilderStore(
			(store) => store.options.contentComponent,
		);
		const hasAutoSnapPoint = useBuilderStore(
			(store) => store.options.snapPoints?.includes("auto") ?? false,
		);
		const contentPointerEvents = isBackdropActive ? "box-none" : pointerEvents;

		const handleContentLayout = useContentLayout("content");

		const contentStyle = useSlotStyles("content");
		const contentProps = useSlotProps("content");

		const contentStyles = [styles.content, contentStyle];

		const screenChildren = hasAutoSnapPoint ? (
			<View collapsable={false} onLayout={handleContentLayout}>
				{children}
			</View>
		) : (
			children
		);

		return (
			<GestureDetector gesture={gestureContext.detectorGesture}>
				<LayerComponent
					component={ContentComponent}
					styles={contentStyles}
					props={contentProps}
					pointerEvents={contentPointerEvents}
				>
					<Clip pointerEvents={contentPointerEvents}>
						<SurfaceLayer pointerEvents={contentPointerEvents}>
							{screenChildren}
						</SurfaceLayer>
						<ScreenFallbackHost />
					</Clip>
				</LayerComponent>
			</GestureDetector>
		);
	},
);

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
