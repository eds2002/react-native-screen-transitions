import type React from "react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type Animated from "react-native-reanimated";
import type { AnimatedRef } from "react-native-reanimated";

type BoundaryAssociatedStyle = React.ComponentProps<
	typeof Animated.View
>["style"];

interface BoundaryOwnerContextValue {
	ownerRef: AnimatedRef<Animated.View>;
	registerTargetRef: (targetRef: AnimatedRef<Animated.View>) => void;
	unregisterTargetRef: (targetRef: AnimatedRef<Animated.View>) => void;
	activeTargetRef: AnimatedRef<Animated.View> | null;
	associatedTargetStyles?: BoundaryAssociatedStyle;
}

const BoundaryOwnerContext = createContext<BoundaryOwnerContextValue | null>(
	null,
);

const MULTIPLE_TARGETS_WARNING =
	"[react-native-screen-transitions] Multiple Boundary.Target elements were rendered under the same boundary owner. The first registered target will be measured.";

export const TARGET_OUTSIDE_OWNER_WARNING =
	"[react-native-screen-transitions] Boundary.Target must be rendered inside a Boundary owner (Boundary.View, Boundary.Trigger, or a component created by createBoundaryComponent).";

export const BoundaryOwnerProvider = (props: {
	value: BoundaryOwnerContextValue;
	children: ReactNode;
}) => {
	const { value, children } = props;

	return (
		<BoundaryOwnerContext.Provider value={value}>
			{children}
		</BoundaryOwnerContext.Provider>
	);
};

export const useBoundaryOwnerContext = () => {
	return useContext(BoundaryOwnerContext);
};

export const useBoundaryOwner = (params: {
	ownerRef: AnimatedRef<Animated.View>;
	associatedTargetStyles?: BoundaryAssociatedStyle;
}) => {
	const { ownerRef, associatedTargetStyles } = params;
	const warnedAboutMultipleTargetsRef = useRef(false);
	const [targetRefs, setTargetRefs] = useState<AnimatedRef<Animated.View>[]>(
		[],
	);

	const registerTargetRef = useCallback(
		(targetRef: AnimatedRef<Animated.View>) => {
			setTargetRefs((prev) => {
				if (prev.includes(targetRef)) {
					return prev;
				}

				if (
					__DEV__ &&
					prev.length > 0 &&
					!warnedAboutMultipleTargetsRef.current
				) {
					warnedAboutMultipleTargetsRef.current = true;
					console.warn(MULTIPLE_TARGETS_WARNING);
				}

				return [...prev, targetRef];
			});
		},
		[],
	);

	const unregisterTargetRef = useCallback(
		(targetRef: AnimatedRef<Animated.View>) => {
			setTargetRefs((prev) =>
				prev.filter((existingRef) => existingRef !== targetRef),
			);
		},
		[],
	);

	const contextValue = useMemo(
		() => ({
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			activeTargetRef: targetRefs[0] ?? null,
			associatedTargetStyles,
		}),
		[
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			targetRefs,
			associatedTargetStyles,
		],
	);

	return {
		contextValue,
		hasActiveTarget: targetRefs.length > 0,
		measuredRef: targetRefs[0] ?? ownerRef,
	};
};
