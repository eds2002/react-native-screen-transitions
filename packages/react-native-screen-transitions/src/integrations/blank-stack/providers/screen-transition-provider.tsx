import type { BlankStackDescriptor } from "../../../types/blank-stack.navigator";
import { ScreenLifecycleController } from "../../../components/controllers/screen-lifecycle.blank";
import { createScreenTransitionProvider } from "../../../providers/create-screen-transition-provider";

export const ScreenTransitionProvider =
	createScreenTransitionProvider<BlankStackDescriptor>(
		ScreenLifecycleController,
	);
