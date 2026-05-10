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
import type { View } from "react-native";
import type Animated from "react-native-reanimated";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";

type BoundaryAssociatedStyle = React.ComponentProps<
	typeof Animated.View
>["style"];

interface BoundaryOwnerContextValue {
	ownerRef: AnimatedRef<View>;
	registerTargetRef: (
		targetRef: AnimatedRef<View>,
		preparedStyles: StyleProps,
	) => void;
	unregisterTargetRef: (targetRef: AnimatedRef<View>) => void;
	activeTargetRef: AnimatedRef<View> | null;
	associatedTargetStyles?: BoundaryAssociatedStyle;
}

type BoundaryTargetEntry = {
	ref: AnimatedRef<View>;
	preparedStyles: StyleProps;
};

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
	ownerRef: AnimatedRef<View>;
	associatedTargetStyles?: BoundaryAssociatedStyle;
}) => {
	const { ownerRef, associatedTargetStyles } = params;
	const warnedAboutMultipleTargetsRef = useRef(false);
	const [targetEntry, setTargetEntry] = useState<BoundaryTargetEntry | null>(
		null,
	);

	const registerTargetRef = useCallback(
		(targetRef: AnimatedRef<View>, preparedStyles: StyleProps) => {
			setTargetEntry((prev) => {
				if (prev?.ref === targetRef) {
					return prev;
				}

				if (
					__DEV__ &&
					prev !== null &&
					!warnedAboutMultipleTargetsRef.current
				) {
					warnedAboutMultipleTargetsRef.current = true;
					console.warn(MULTIPLE_TARGETS_WARNING);
				}

				return prev ?? { ref: targetRef, preparedStyles };
			});
		},
		[],
	);

	const unregisterTargetRef = useCallback((targetRef: AnimatedRef<View>) => {
		setTargetEntry((prev) => (prev?.ref === targetRef ? null : prev));
	}, []);

	const contextValue = useMemo(
		() => ({
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			activeTargetRef: targetEntry?.ref ?? null,
			associatedTargetStyles,
		}),
		[
			ownerRef,
			registerTargetRef,
			unregisterTargetRef,
			targetEntry,
			associatedTargetStyles,
		],
	);

	return {
		contextValue,
		hasActiveTarget: targetEntry !== null,
		measuredRef: targetEntry?.ref ?? ownerRef,
		targetPreparedStyles: targetEntry?.preparedStyles,
	};
};
