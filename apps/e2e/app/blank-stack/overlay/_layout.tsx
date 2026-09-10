import {
	OverlayA,
	OverlayC,
	OverlayE,
	overlayIOSSlideOptions,
	screenIOSSlideOptions,
} from "@/components/overlay-playground";
import { BlankStack } from "@/layouts/blank-stack";

export default function OverlayPlaygroundLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					...overlayIOSSlideOptions,
					gestureEnabled: false,
					overlay: OverlayA,
					overlayShown: true,
				}}
			/>
			<BlankStack.Screen
				name="second"
				options={{
					...screenIOSSlideOptions,
				}}
			/>
			<BlankStack.Screen
				name="third"
				options={{
					...overlayIOSSlideOptions,
					overlay: OverlayC,
					overlayShown: true,
				}}
			/>
			<BlankStack.Screen
				name="fourth"
				options={{
					...screenIOSSlideOptions,
				}}
			/>
			<BlankStack.Screen
				name="fifth"
				options={{
					...overlayIOSSlideOptions,
					overlay: OverlayE,
					overlayShown: true,
				}}
			/>
		</BlankStack>
	);
}
