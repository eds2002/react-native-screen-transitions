import {
	type CodegenTypes,
	codegenNativeComponent,
	type HostComponent,
	type ViewProps,
} from "react-native";

export type ScrollObservedEvent = Readonly<{
	horizontal: boolean;
	offset: CodegenTypes.Double;
	contentSize: CodegenTypes.Double;
	layoutSize: CodegenTypes.Double;
	isTouched: boolean;
}>;

export interface NativeProps extends ViewProps {
	/** Handler tags of the screen gestures a plain scroll view waits on before it scrolls. */
	waitFor?: ReadonlyArray<CodegenTypes.Int32>;
	/** A plain scroll view under a finger scrolled, resized, or was touched or let go. */
	onScrollObserved?: CodegenTypes.DirectEventHandler<ScrollObservedEvent>;
}

export default codegenNativeComponent<NativeProps>("RNSTScrollObserver", {
	excludedPlatforms: ["android"],
}) as HostComponent<NativeProps>;
