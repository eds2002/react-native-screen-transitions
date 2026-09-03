import type { SmoothClipAnimation } from "react-native-smooth-clip-view";
import type { ClipStreamCanonicalSnapshot } from "../../clip/clip-stream-ui";

export type SmoothClipGestureCompletion = Readonly<{
	begin: (
		completionId: number,
		snapshots: readonly ClipStreamCanonicalSnapshot[],
		currentProgress: number,
		targetProgress: number,
		progressVelocity: number,
		animation: SmoothClipAnimation | null,
	) => void;
	completeReanimated: (completionId: number, finished: boolean) => void;
	completeReset: (completionId: number, finished: boolean) => void;
	completionId: number;
	snapshots: readonly ClipStreamCanonicalSnapshot[];
}>;
