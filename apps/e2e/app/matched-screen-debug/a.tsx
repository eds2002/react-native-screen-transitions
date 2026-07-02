import { DebugScreen } from "./debug-screen";

export default function MatchedScreenDebugA() {
	return (
		<DebugScreen
			letter="a"
			next="b"
			backgroundColor="#F4F1E8"
			placementStyle={{ left: 36, top: 132 }}
			showVideo
		/>
	);
}
