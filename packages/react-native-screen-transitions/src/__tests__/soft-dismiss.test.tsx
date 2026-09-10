import { mountMotionTransitionValues } from "./helpers/mount-transition-values";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { MotionProvider, getMotionStore } from "../providers/screen/motion";
let motionRenderer: ReturnType<typeof create>;
afterEach(() => {
	act(() => motionRenderer?.unmount());
});
import { LifecycleTransitionRequestKind } from "../providers/screen/motion/hooks/use-transition-values";
import { isCloseActionReplay } from "../utils/navigation/close-action-replay";

let system = mountMotionTransitionValues();
const route = { key: "soft-dismiss-route", name: "details" };
const current = {
	route,
	options: {enableTransitions: true},
	navigation: null as any,
};
let beforeRemoveListener: ((event: any) => void) | undefined;
let dispatchedActions: any[];
let dispatchedReplayFlags: boolean[];
let emitBeforeRemoveOnDispatch: boolean;
let replayPreventCount: number;
const navigation = {
	getState: () => ({
		key: "stack",
		index: 1,
		routes: [{ key: "index" }, route],
	}),
	dispatch: (action: any) => {
		dispatchedReplayFlags.push(isCloseActionReplay(action));
		if (emitBeforeRemoveOnDispatch) {
			beforeRemoveListener?.({
				data: { action: { ...action } },
				preventDefault: () => {
					replayPreventCount += 1;
				},
			});
		}
		dispatchedActions.push(action);
	},
	addListener: (type: string, listener: (event: any) => void) => {
		if (type === "beforeRemove") {
			beforeRemoveListener = listener;
		}
		return () => {};
	},
};
current.navigation = navigation;
let requestStackDismiss: ((payload: { route: typeof route }) => boolean) | null;
let softDismissCount: number;
let blankCloseCount: number;
let handleBlankClose: boolean;

mock.module("../providers/screen/builder", () => ({
	useOptionalBuilderStore: () => null,
	useBuilderStore: (selector: (store: any) => unknown) =>
		selector({
			descriptors: { current },
			options: current.options,
			derivations: {
				currentScreenKey: route.key,
			},
		}),
}));

mock.module("../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: (selector: (stack: any) => unknown) =>
		selector({
			requestDismiss: requestStackDismiss,
			handleCloseRoute: handleBlankClose
				? () => {
						blankCloseCount += 1;
					}
				: undefined,
			routeKeys: [],
			scenes: [],
			scenesByKey: {
				[route.key]: { activity: "active" },
			},
		}),
}));


const { useNativeCloseTransitionIntent } = await import("../adapters/with-screen-transitions/lifecycle/use-native-close-transition-intent");

const { useNavigationHelpers } = await import(
	"../hooks/navigation/use-navigation-helpers"
);
const { useCloseTransitionIntent } = await import(
	"../components/screen/lifecycle/hooks/use-close-transition-intent"
);

beforeEach(() => {
 current.options.enableTransitions = true;
	(globalThis as any).resetMutableRegistry();
	act(() => {
		motionRenderer = create(<MotionProvider>{null}</MotionProvider>);
	});
	system = getMotionStore(route.key).state;
	beforeRemoveListener = undefined;
	dispatchedActions = [];
	dispatchedReplayFlags = [];
	emitBeforeRemoveOnDispatch = false;
	replayPreventCount = 0;
	softDismissCount = 0;
	blankCloseCount = 0;
	handleBlankClose = true;
	requestStackDismiss = () => {
		softDismissCount += 1;
		return true;
	};
});

describe("soft dismissal", () => {
	it("starts lifecycle motion when a programmatic soft dismiss has no owner", () => {
		let requestDismiss: (() => boolean) | undefined;
		const Harness = () => {
			requestDismiss = useNavigationHelpers().requestDismiss;
			return null;
		};

		act(() => {
			create(
				<MotionProvider screenKey={route.key}>
					<Harness />
				</MotionProvider>,
			);
		});
		act(() => {
			requestDismiss?.();
		});

		expect(system.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.Close,
		);
	});

	it("starts native lifecycle motion through the same soft-dismiss gate", () => {
		let requestDismiss: (() => boolean) | undefined;
		requestStackDismiss = null;

		const Harness = () => {
			requestDismiss = useNavigationHelpers().requestDismiss;
			return null;
		};

		act(() => {
			create(
				<MotionProvider screenKey={route.key}>
					<Harness />
				</MotionProvider>,
			);
		});
		act(() => {
			requestDismiss?.();
		});

		expect(system.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.Close,
		);
	});

	it("keeps gesture-owned motion when requesting the soft dismiss", () => {
		let requestDismiss: (() => boolean) | undefined;
		getMotionStore(route.key).state.closing.set(1);

		const Harness = () => {
			requestDismiss = useNavigationHelpers().requestDismiss;
			return null;
		};

		act(() => {
			create(
				<MotionProvider screenKey={route.key}>
					<Harness />
				</MotionProvider>,
			);
		});
		act(() => {
			requestDismiss?.();
		});

		expect(softDismissCount).toBe(1);
		expect(system.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.None,
		);
	});

	it("uses the current native stack for terminal gesture removal", () => {
		let completeClose: (() => void) | undefined;
		handleBlankClose = false;
		requestStackDismiss = null;
		emitBeforeRemoveOnDispatch = true;

		const Harness = () => {
			completeClose = useNativeCloseTransitionIntent(current as any).completeClose;
			return null;
		};

		act(() => {
			create(
				<MotionProvider screenKey={route.key}>
					<Harness />
				</MotionProvider>,
			);
		});

		const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (callback) => {
			callback(0);
			return 0;
		};
		try {
			act(() => {
				completeClose?.();
			});
		} finally {
			globalThis.requestAnimationFrame = originalRequestAnimationFrame;
		}

		expect(blankCloseCount).toBe(0);
		expect(dispatchedReplayFlags).toEqual([true]);
		expect(replayPreventCount).toBe(0);
		expect(dispatchedActions).toEqual([
			{
				type: "POP",
				payload: { count: 1 },
				source: route.key,
				target: "stack",
			},
		]);
	});

	it("does not intercept a blank-stack programmatic removal", () => {
		const action = { type: "POP", payload: { count: 1 } };
		let prevented = false;

		const Harness = () => {
			useCloseTransitionIntent(current as any);
			return null;
		};

		act(() => {
			create(
				<MotionProvider screenKey={route.key}>
					<Harness />
				</MotionProvider>,
			);
		});
		act(() => {
			beforeRemoveListener?.({
				data: { action },
				preventDefault: () => {
					prevented = true;
				},
			});
		});

		expect(prevented).toBe(false);
		expect(softDismissCount).toBe(0);
		expect(dispatchedActions).toEqual([]);
	});

 it("leaves native removal alone without adapter opt-in", () => {
  current.options.enableTransitions = false;
  requestStackDismiss = null;
  let prevented = false;
  const Harness = () => { useNativeCloseTransitionIntent(current as any); return null; };
  act(() => { create(<MotionProvider screenKey={route.key}><Harness /></MotionProvider>); });
  act(() => { beforeRemoveListener?.({data: {action: {type: "POP", payload: {count: 1}}}, preventDefault: () => {prevented = true;}}); });
  expect(beforeRemoveListener).toBeDefined();
  expect(prevented).toBe(false);
  expect(system.pendingLifecycleRequestKind.get()).toBe(LifecycleTransitionRequestKind.None);
 });

 it("completes Blank Stack removal through its owner without a native pop", () => {
  let completeClose: (() => void) | undefined;
  const Harness = () => { completeClose = useCloseTransitionIntent(current as any).completeClose; return null; };
  act(() => { create(<MotionProvider screenKey={route.key}><Harness /></MotionProvider>); });
  act(() => { completeClose?.(); });
  expect(blankCloseCount).toBe(1);
  expect(dispatchedActions).toEqual([]);
  expect(beforeRemoveListener).toBeUndefined();
 });

	it("converts an adapter programmatic removal into a soft dismiss", () => {
		const action = { type: "POP", payload: { count: 1 } };
		let prevented = false;
		let completeClose: (() => void) | undefined;
		handleBlankClose = false;
		requestStackDismiss = null;

		const Harness = () => {
			completeClose = useNativeCloseTransitionIntent(current as any).completeClose;
			return null;
		};

		act(() => {
			create(
				<MotionProvider screenKey={route.key}>
					<Harness />
				</MotionProvider>,
			);
		});
		act(() => {
			beforeRemoveListener?.({
				data: { action },
				preventDefault: () => {
					prevented = true;
				},
			});
		});

		expect(prevented).toBe(true);
		expect(softDismissCount).toBe(0);
		expect(dispatchedActions).toEqual([]);
		expect(system.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.Close,
		);

		const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (callback) => {
			callback(0);
			return 0;
		};
		try {
			act(() => {
				completeClose?.();
			});
		} finally {
			globalThis.requestAnimationFrame = originalRequestAnimationFrame;
		}
		expect(dispatchedActions).toHaveLength(1);
		expect(dispatchedActions[0]).toBe(action);
		expect(dispatchedReplayFlags).toEqual([true]);
		expect(getMotionStore(route.key).state).toBeDefined();
		expect(system.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.Close,
		);
	});
});
