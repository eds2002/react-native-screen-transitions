import { useEffect } from "react";
import { runOnJS } from "react-native-reanimated";
import { animate } from "../../../utils/animation/animate";
import { useKeys } from "../../context/keys";
import useStableCallback from "../../hooks/use-stable-callback";
import { Animations } from "../../stores/animations";
import { Bounds } from "../../stores/bounds";
import { Gestures } from "../../stores/gestures";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";

interface ScreenLifecycleProps {
	children: React.ReactNode;
}

export const ScreenLifecycleController = ({
	children,
}: ScreenLifecycleProps) => {
	const { current } = useKeys();

	const progress = Animations.getAnimation(current.route.key, "progress");
	const animating = Animations.getAnimation(current.route.key, "animating");
	const closing = Animations.getAnimation(current.route.key, "closing");

	const spec = current.options.transitionSpec;

	const handleBeforeRemove = useStableCallback((e: any) => {
		const key = current.navigation.getParent()?.getState().key;
		const requestedDismissOnNavigator = NavigatorDismissState.get(key);

		// Don't run e.preventDefault when the dismissal was on the local root
		if (requestedDismissOnNavigator) {
			return;
		}

		// Don't run e.preventDefault when this is the first screen of the stack
		if (current.navigation.getState().index === 0) {
			return;
		}

		e.preventDefault();

		const onAnimationFinish = (finished: boolean) => {
			if (finished) {
				current.navigation.dispatch(e.data.action);
				Animations.clear(current.route.key);
				Gestures.clear(current.route.key);
				Bounds.clear(current.route.key);
			}
		};

		closing.value = 1;
		animating.value = 1;
		progress.value = animate(0, spec?.close, (finished) => {
			"worklet";
			if (finished && onAnimationFinish) {
				animating.value = 0;
				runOnJS(onAnimationFinish)(finished);
			}
		});
	});

	const handleInitialize = useStableCallback(() => {
		progress.value = animate(
			1,
			current.options.transitionSpec?.open,
			(finished) => {
				"worklet";
				animating.value = !finished ? 1 : 0;
			},
		);
	});

	useEffect(() => {
		handleInitialize();
	}, [handleInitialize]);

	useEffect(() => {
		const unsubscribe = current.navigation.addListener(
			"beforeRemove",
			handleBeforeRemove,
		);

		return unsubscribe;
	}, [current.navigation, handleBeforeRemove]);

	return children;
};
