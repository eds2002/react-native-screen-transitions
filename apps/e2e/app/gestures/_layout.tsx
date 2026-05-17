import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";
import { PINCH_PROBE_OPTIONS } from "./pinch-shadowing/shared";
import {
	verticalInvertedSlideOptions,
	verticalSlideOptions,
} from "./transition-options";

export default function GesturesLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			{/* Basic Examples */}
			<BlankStack.Screen
				name="simple-inheritance"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen name="two-axes" options={verticalSlideOptions()} />
			<BlankStack.Screen
				name="same-axis-shadowing"
				options={verticalSlideOptions()}
			/>
			{/* Intermediate Examples */}
			<BlankStack.Screen name="deep-nesting" options={verticalSlideOptions()} />
			<BlankStack.Screen
				name="inverted-gesture"
				options={verticalInvertedSlideOptions()}
			/>
			<BlankStack.Screen
				name="coexistence"
				options={verticalInvertedSlideOptions()}
			/>
			<BlankStack.Screen name="pinch-shadowing" options={PINCH_PROBE_OPTIONS} />
			{/* Snap Point Examples */}
			<BlankStack.Screen
				name="snap-shadows-axis"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen
				name="snap-different-axis"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen
				name="snap-deep-nesting"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen
				name="claim-fallback"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen
				name="snap-locked-no-bubble"
				options={verticalSlideOptions()}
			/>
			{/* ScrollView Examples */}
			<BlankStack.Screen
				name="scroll-direction-propagation"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen
				name="scroll-direction-propagation-horizontal"
				options={{ ...IOSSlide() }}
			/>
			<BlankStack.Screen
				name="scroll-boundary"
				options={verticalSlideOptions()}
			/>
			<BlankStack.Screen name="scroll-apple-maps" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="scroll-instagram" options={{ ...IOSSlide() }} />
		</BlankStack>
	);
}
