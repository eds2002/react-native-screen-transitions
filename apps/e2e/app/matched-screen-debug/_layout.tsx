import "react-native-reanimated";

import { interpolate } from "react-native-reanimated";
import type { BoundsMotion } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

const depth: BoundsMotion = ({ current, progress, props }) => {
	"worklet";

	const depthScreenRatio = 0.3;
	const maxDepthY = 220;
	const scaleDip = 0.25;
	const arcSharpness = 1;

	const depthY = Math.min(
		props.layouts.screen.height * depthScreenRatio,
		maxDepthY,
	);
	const clampedProgress = Math.max(0, Math.min(1, progress));
	const arc = Math.sin(clampedProgress * Math.PI) ** arcSharpness;

	if (!props.active.entering) {
		return {
			x: current.x,
			y: current.y,
			scale: current.scale,
		};
	}

	return {
		...current,
		y: current.y + depthY * arc,
		scale: current.scale * (1 - scaleDip * arc),
	};
};

export default function MatchedScreenDebugLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="player"
				options={{
					gestureEnabled: true,
					gestureDirection: "bidirectional",
					gestureReleaseVelocityScale: 2,
					screenStyleInterpolator: ({ active, bounds, focused, layouts }) => {
						"worklet";

						const scoped = bounds("video");
						const link = scoped.link();

						if (link?.status !== "complete") {
							return null;
						}

						const source = link.source.bounds;
						const destination = link.destination.bounds;

						const sourceCenterX = source.pageX + source.width / 2;
						const sourceCenterY = source.pageY + source.height / 2;
						const destinationCenterX =
							destination.pageX + destination.width / 2;
						const destinationCenterY =
							destination.pageY + destination.height / 2;

						const element = scoped.math({
							scaleMode: "match",
						});
						const screenCenterX = layouts.screen.width / 2;
						const screenCenterY = layouts.screen.height / 2;
						const initialContentScale = Math.max(
							source.width / destination.width,
							source.height / destination.height,
						);
						const scaledDestinationCenterX =
							screenCenterX +
							(destinationCenterX - screenCenterX) * initialContentScale;
						const scaledDestinationCenterY =
							screenCenterY +
							(destinationCenterY - screenCenterY) * initialContentScale;
						const initialContentTranslateX =
							sourceCenterX - scaledDestinationCenterX;
						const initialContentTranslateY =
							sourceCenterY - scaledDestinationCenterY;
						const parentProgress = Math.max(0, Math.min(1, active.progress));
						const parentScale =
							initialContentScale + (1 - initialContentScale) * parentProgress;
						const safeParentScale =
							Math.abs(parentScale) > 0.0001 ? parentScale : 1;
						const parentTranslateX =
							initialContentTranslateX * (1 - parentProgress);
						const parentTranslateY =
							initialContentTranslateY * (1 - parentProgress);
						const desiredCenterX = sourceCenterX + element.translateX;
						const desiredCenterY = sourceCenterY + element.translateY;
						const desiredWidth = source.width * element.scaleX;
						const desiredHeight = source.height * element.scaleY;
						const localCenterX =
							screenCenterX +
							(desiredCenterX - parentTranslateX - screenCenterX) /
								safeParentScale;
						const localCenterY =
							screenCenterY +
							(desiredCenterY - parentTranslateY - screenCenterY) /
								safeParentScale;

						if (focused) {
							const contentStyle = scoped.styles({
								method: "content",
								scaleMode: "match",
							});

							return {
								content: {
									...contentStyle,
									transform: [
										{ translateX: active.gesture.x },
										{ translateY: active.gesture.y },
										...contentStyle.transform,
									],
								},
							};
						}

						return {
							video: {
								style: {
									transform: [
										{
											translateX: localCenterX - sourceCenterX,
										},
										{
											translateY: localCenterY - sourceCenterY,
										},
										{
											scaleX: desiredWidth / source.width / safeParentScale,
										},
										{
											scaleY: desiredHeight / source.height / safeParentScale,
										},
									],
								},
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
