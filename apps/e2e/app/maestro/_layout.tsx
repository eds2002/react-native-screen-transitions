// @ts-nocheck
import { BlankStack } from "@/layouts/blank-stack";
import {
	boundsOptions,
	MaestroOverlay,
	multiAxisSnapOptions,
	pinchOptions,
	sheetOptions,
	slideOptions,
} from "@/components/maestro/options";

const hostOptions = slideOptions("horizontal", { gestureEnabled: false });

export default function MaestroLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" options={{ animation: "none" }} />

			<BlankStack.Screen name="navigation" options={hostOptions} />
			<BlankStack.Screen
				name="navigation-detail"
				options={slideOptions("horizontal")}
			/>
			<BlankStack.Screen
				name="navigation-third"
				options={slideOptions("horizontal")}
			/>

			<BlankStack.Screen name="pointer-events" options={hostOptions} />
			<BlankStack.Screen
				name="pointer-events-detail"
				options={slideOptions("horizontal")}
			/>

			<BlankStack.Screen name="swipe" options={hostOptions} />
			<BlankStack.Screen
				name="swipe-horizontal"
				options={slideOptions("horizontal")}
			/>
			<BlankStack.Screen
				name="swipe-horizontal-inverted"
				options={slideOptions("horizontal-inverted")}
			/>
			<BlankStack.Screen name="swipe-vertical" options={slideOptions("vertical")} />
			<BlankStack.Screen
				name="swipe-vertical-inverted"
				options={slideOptions("vertical-inverted")}
			/>
			<BlankStack.Screen
				name="swipe-wrong-axis"
				options={slideOptions("horizontal")}
			/>
			<BlankStack.Screen
				name="swipe-short"
				options={slideOptions("horizontal")}
			/>

			<BlankStack.Screen name="pinch" options={hostOptions} />
			<BlankStack.Screen name="pinch-in" options={pinchOptions("pinch-in")} />
			<BlankStack.Screen name="pinch-out" options={pinchOptions("pinch-out")} />

			<BlankStack.Screen name="gesture-enablement" options={hostOptions} />
			<BlankStack.Screen
				name="gesture-disabled"
				options={slideOptions("horizontal", { gestureEnabled: false })}
			/>
			<BlankStack.Screen
				name="gesture-edge"
				options={slideOptions("horizontal", { gestureActivationArea: "edge" })}
			/>

			<BlankStack.Screen name="snap-points" options={hostOptions} />
			<BlankStack.Screen
				name="snap-points-sheet"
				options={sheetOptions({
					snapPoints: [0.35, 0.65, 1],
					initialSnapIndex: 1,
				})}
			/>

			<BlankStack.Screen name="sheet-directions" options={hostOptions} />
			<BlankStack.Screen
				name="sheet-bottom"
				options={sheetOptions({ snapPoints: [0.45, 1], initialSnapIndex: 0 })}
			/>
			<BlankStack.Screen
				name="sheet-right"
				options={sheetOptions({
					direction: "horizontal",
					snapPoints: [0.45, 1],
					initialSnapIndex: 0,
				})}
			/>

			<BlankStack.Screen name="auto-snap" options={hostOptions} />
			<BlankStack.Screen
				name="auto-snap-sheet"
				options={sheetOptions({
					snapPoints: ["auto", 1],
					initialSnapIndex: 0,
				})}
			/>

			<BlankStack.Screen name="programmatic-snap" options={hostOptions} />
			<BlankStack.Screen
				name="programmatic-snap-sheet"
				options={sheetOptions({
					snapPoints: [0.3, 0.6, 1],
					initialSnapIndex: 1,
				})}
			/>

			<BlankStack.Screen name="snap-lock" options={hostOptions} />
			<BlankStack.Screen
				name="snap-lock-sheet"
				options={sheetOptions({
					snapPoints: [0.3, 0.6, 1],
					initialSnapIndex: 1,
					gestureSnapLocked: true,
					sheetScrollGestureBehavior: "expand-and-collapse",
				})}
			/>

			<BlankStack.Screen name="multi-axis-snap" options={hostOptions} />
			<BlankStack.Screen
				name="multi-axis-snap-sheet"
				options={multiAxisSnapOptions}
			/>

			<BlankStack.Screen name="scroll-handoff" options={hostOptions} />
			<BlankStack.Screen
				name="scroll-handoff-sheet"
				options={sheetOptions({
					snapPoints: [0.45, 0.85],
					initialSnapIndex: 1,
					sheetScrollGestureBehavior: "expand-and-collapse",
				})}
			/>

			<BlankStack.Screen
				name="gesture-ownership"
				options={slideOptions("vertical", { gestureEnabled: true })}
			/>
			<BlankStack.Screen
				name="gesture-owner-sheet"
				options={sheetOptions({
					snapPoints: [0.45, 0.85],
					initialSnapIndex: 1,
					gestureSnapLocked: true,
				})}
			/>

			<BlankStack.Screen name="backdrop" options={hostOptions} />
			<BlankStack.Screen
				name="backdrop-dismiss"
				options={sheetOptions({
					backdropBehavior: "dismiss",
					snapPoints: [0.5],
				})}
			/>
			<BlankStack.Screen
				name="backdrop-collapse"
				options={sheetOptions({
					backdropBehavior: "collapse",
					snapPoints: [0.45, 0.8],
					initialSnapIndex: 1,
				})}
			/>
			<BlankStack.Screen
				name="backdrop-block"
				options={sheetOptions({
					backdropBehavior: "block",
					snapPoints: [0.5],
				})}
			/>
			<BlankStack.Screen
				name="backdrop-passthrough"
				options={sheetOptions({
					backdropBehavior: "passthrough",
					snapPoints: [0.5],
				})}
			/>
			<BlankStack.Screen
				name="backdrop-custom"
				options={sheetOptions({
					backdropBehavior: "dismiss",
					customBackdrop: true,
					snapPoints: [0.5],
				})}
			/>

			<BlankStack.Screen
				name="overlay"
				options={{
					...slideOptions("horizontal", { gestureEnabled: false }),
					overlay: MaestroOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<BlankStack.Screen
				name="overlay-second"
				options={{
					...slideOptions("horizontal"),
					overlay: MaestroOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>

			<BlankStack.Screen name="bounds" options={hostOptions} />
			<BlankStack.Screen name="bounds-detail" options={boundsOptions} />
		</BlankStack>
	);
}
