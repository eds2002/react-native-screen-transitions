import type { NativeStackDescriptor } from "../../../types/native-stack.navigator";
import { ScreenLifecycleController } from "../../../components/controllers/screen-lifecycle";
import { createScreenTransitionProvider } from "../../../providers/create-screen-transition-provider";

export const ScreenTransitionProvider =
  createScreenTransitionProvider<NativeStackDescriptor>(
    ScreenLifecycleController
  );
