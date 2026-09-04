import { memo, type ReactNode } from "react";
import { BlankStackProvider } from "../providers/stack/blank-stack.provider";
import {
	type StackCoreConfig,
	StackCoreProvider,
} from "../providers/stack/core.provider";
import { StackTransitionProvider } from "../providers/stack/stack-transition";
import type { BlankStackProviderProps } from "../types/providers/blank-stack-provider.types";

export type BlankStackRuntimeProps = BlankStackProviderProps &
	StackCoreConfig & {
		children: ReactNode;
	};

export const BlankStackRuntime = memo(function BlankStackRuntime({
	TRANSITIONS_ALWAYS_ON,
	children,
	state,
	navigation,
	descriptors,
}: BlankStackRuntimeProps) {
	return (
		<StackCoreProvider
			config={{
				TRANSITIONS_ALWAYS_ON: TRANSITIONS_ALWAYS_ON ?? true,
			}}
		>
			<BlankStackProvider
				state={state}
				navigation={navigation}
				descriptors={descriptors}
			>
				<StackTransitionProvider>{children}</StackTransitionProvider>
			</BlankStackProvider>
		</StackCoreProvider>
	);
});
