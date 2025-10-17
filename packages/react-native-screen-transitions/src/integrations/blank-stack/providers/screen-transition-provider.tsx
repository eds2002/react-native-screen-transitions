import { ScreenLifecycleController } from "../../../components/controllers/screen-lifecycle.blank";
import { createScreenTransitionProvider } from "../../../providers/create-screen-transition-provider";
import type { BlankStackDescriptor } from "../../../types/blank-stack.navigator";

export const ScreenTransitionProvider =
	createScreenTransitionProvider<BlankStackDescriptor>(
		ScreenLifecycleController,
		{ defaultEnableTransitions: true },
	);
