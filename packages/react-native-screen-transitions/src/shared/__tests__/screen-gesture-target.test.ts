import { describe, expect, it } from "bun:test";
import type { GestureType } from "react-native-gesture-handler";
import { NO_CLAIMS } from "../types/ownership.types";
import { resolveScreenGestureTarget } from "../hooks/gestures/resolve-screen-gesture-target";
import type { GestureContextType } from "../providers/gestures";

const createGestureRef = (label: string) =>
	({ current: label as unknown as GestureType }) as GestureContextType["panGestureRef"];

const createContext = ({
	label,
	ancestorContext = null,
	isIsolated = false,
}: {
	label: string;
	ancestorContext?: GestureContextType | null;
	isIsolated?: boolean;
}): GestureContextType => ({
	panGesture: label as unknown as GestureType,
	panGestureRef: createGestureRef(label),
	scrollConfig: {} as GestureContextType["scrollConfig"],
	gestureAnimationValues:
		{} as GestureContextType["gestureAnimationValues"],
	ancestorContext,
	gestureEnabled: true,
	isIsolated,
	claimedDirections: NO_CLAIMS,
	childDirectionClaims:
		{} as GestureContextType["childDirectionClaims"],
});

describe("resolveScreenGestureTarget", () => {
	const root = createContext({ label: "root" });
	const parent = createContext({ label: "parent", ancestorContext: root });
	const self = createContext({ label: "self", ancestorContext: parent });

	it("returns self by default", () => {
		const resolved = resolveScreenGestureTarget({
			target: undefined,
			self,
		});

		expect(resolved).toBe(self.panGestureRef);
	});

	it("returns parent when requested", () => {
		const resolved = resolveScreenGestureTarget({
			target: "parent",
			self,
		});

		expect(resolved).toBe(parent.panGestureRef);
	});

	it("returns root when requested", () => {
		const resolved = resolveScreenGestureTarget({
			target: "root",
			self,
		});

		expect(resolved).toBe(root.panGestureRef);
	});

	it("resolves explicit ancestor depth", () => {
		const resolved = resolveScreenGestureTarget({
			target: { ancestor: 2 },
			self,
		});

		expect(resolved).toBe(root.panGestureRef);
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

	it("stops resolving at isolation boundaries", () => {
		const isolatedRoot = createContext({
			label: "isolated-root",
			isIsolated: true,
		});
		const isolatedParent = createContext({
			label: "isolated-parent",
			ancestorContext: isolatedRoot,
			isIsolated: true,
		});
		const screen = createContext({
			label: "screen",
			ancestorContext: isolatedParent,
			isIsolated: false,
		});

		const parentResolved = resolveScreenGestureTarget({
			target: "parent",
			self: screen,
		});
		const rootResolved = resolveScreenGestureTarget({
			target: "root",
			self: screen,
		});

		expect(parentResolved).toBeNull();
		expect(rootResolved).toBeNull();
	});
});
