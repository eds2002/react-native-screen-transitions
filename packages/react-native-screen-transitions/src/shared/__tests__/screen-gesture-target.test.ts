import { describe, expect, it, mock } from "bun:test";
import type { PanGesture } from "react-native-gesture-handler";
import { NO_CLAIMS } from "../types/ownership.types";
import type { GestureContextType } from "../providers/screen/gestures";

mock.module("../providers/screen/gestures/gestures.provider", () => ({
	useGestureContext: () => null,
}));

const { resolveScreenGestureTarget } = await import(
	"../providers/screen/gestures/hooks/use-screen-gesture"
);

const createContext = ({
	label,
	gestureContext = null,
}: {
	label: string;
	gestureContext?: GestureContextType | null;
}): GestureContextType => ({
	detectorGesture: label as unknown as PanGesture,
	panGesture: label as unknown as PanGesture,
	pinchGesture: undefined,
	scrollState: {} as GestureContextType["scrollState"],
	gestureContext,
	gestureEnabled: true,
	claimedDirections: NO_CLAIMS,
	childDirectionClaims:
		{} as GestureContextType["childDirectionClaims"],
});

describe("resolveScreenGestureTarget", () => {
	const root = createContext({ label: "root" });
	const parent = createContext({ label: "parent", gestureContext: root });
	const self = createContext({ label: "self", gestureContext: parent });

	it("returns self by default", () => {
		const resolved = resolveScreenGestureTarget({
			target: undefined,
			self,
		});

		expect(resolved).toBe(self.panGesture);
	});

	it("returns parent when requested", () => {
		const resolved = resolveScreenGestureTarget({
			target: "parent",
			self,
		});

		expect(resolved).toBe(parent.panGesture);
	});

	it("returns root when requested", () => {
		const resolved = resolveScreenGestureTarget({
			target: "root",
			self,
		});

		expect(resolved).toBe(root.panGesture);
	});

	it("resolves explicit ancestor depth", () => {
		const resolved = resolveScreenGestureTarget({
			target: { ancestor: 2 },
			self,
		});

		expect(resolved).toBe(root.panGesture);
	});

	it("returns null for missing or invalid ancestors", () => {
		const missingParent = resolveScreenGestureTarget({
			target: "parent",
			self: root,
		});
		const outOfRange = resolveScreenGestureTarget({
			target: { ancestor: 10 },
			self,
		});
		const zero = resolveScreenGestureTarget({
			target: { ancestor: 0 },
			self,
		});
		const negative = resolveScreenGestureTarget({
			target: { ancestor: -1 },
			self,
		});
		const nonInteger = resolveScreenGestureTarget({
			target: { ancestor: 1.5 },
			self,
		});

		expect(missingParent).toBeNull();
		expect(outOfRange).toBeNull();
		expect(zero).toBeNull();
		expect(negative).toBeNull();
		expect(nonInteger).toBeNull();
	});
});
