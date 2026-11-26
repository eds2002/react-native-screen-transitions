import {
	createSynchronizable,
	type Synchronizable,
	scheduleOnRN,
	scheduleOnUI,
} from "react-native-worklets";
import { IS_WEB } from "../../../../../../constants";
import { clear } from "../../../../../../stores/bounds/internals/clear";
import { ScrollStore } from "../../../../../../stores/scroll.store";

type Cleanup = Pick<Synchronizable<boolean>, "getBlocking" | "setBlocking">;
const pending = new Map<string, Cleanup>();

export function cancelScreenBoundsCleanup(routeKey: string) {
	pending.get(routeKey)?.setBlocking(true);
	pending.delete(routeKey);
}

export function resetStoresForScreen(routeKey: string) {
	ScrollStore.clearBag(routeKey);

	if (pending.has(routeKey)) return;
	let cancelled = false;
	const cleanup = IS_WEB
		? {
				getBlocking: () => cancelled,
				setBlocking: (value: boolean) => {
					cancelled = value;
				},
			}
		: createSynchronizable(false);
	pending.set(routeKey, cleanup);
	const finish = () => {
		if (pending.get(routeKey) === cleanup) pending.delete(routeKey);
	};

	scheduleOnUI(() => {
		"worklet";
		if (!cleanup.getBlocking()) clear(routeKey);
		scheduleOnRN(finish);
	});
}
