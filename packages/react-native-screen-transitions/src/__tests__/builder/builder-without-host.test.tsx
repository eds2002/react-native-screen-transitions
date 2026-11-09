import { afterEach, beforeEach, expect, it } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
	BuilderProvider,
	useBuilderStore,
} from "../../providers/builder/builder.provider";
import { screenTopology } from "../../providers/builder/topology/helpers/create-screen-topology";
import { MotionProvider } from "../../providers/motion";
import { useMotionStore } from "../../providers/motion/motion.store";

// The engine learns about surrounding screens from a host, never from
// React Navigation. A screen mounted with no host must not touch navigation.
const navigation = {
	getState: () => {
		throw new Error("The engine must not read navigation state");
	},
	dispatch: () => {
		throw new Error("The engine must not dispatch navigation actions");
	},
};

let renderer: ReactTestRenderer | undefined;

beforeEach(() => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
});

it("runs a screen outside any navigator without reading navigation state", () => {
	let isFirstKey: boolean | undefined;
	let hasMotion = false;
	function Probe() {
		isFirstKey = useBuilderStore((store) => store.derivations.isFirstKey);
		hasMotion = !!useMotionStore((store) => store.state.transitionProgress);
		return null;
	}

	act(() => {
		renderer = create(
			<BuilderProvider
				routeKey="standalone"
				descriptors={{
					current: {
						route: { key: "standalone", name: "standalone" },
						navigation,
						options: { snapPoints: [0.5, 1] },
					},
				}}
			>
				<MotionProvider>
					<Probe />
				</MotionProvider>
			</BuilderProvider>,
		);
	});

	expect(hasMotion).toBe(true);
	// Only a host can make a screen its navigator's first route.
	expect(isFirstKey).toBe(false);
	// Without a host the screen joins no navigator topology.
	expect(screenTopology.getRelationships("standalone").parentScreenKey).toBe(
		null,
	);
});
