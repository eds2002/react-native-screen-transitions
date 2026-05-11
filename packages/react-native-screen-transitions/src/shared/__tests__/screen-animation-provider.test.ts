import React, { type ReactNode, useLayoutEffect, useRef } from "react";
import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { ScreenAnimationContextValue } from "../providers/screen/animation/animation.provider";
import type { ScreenInterpolatorFrame } from "../providers/screen/animation/helpers/pipeline";

type TestRenderer = typeof import("react-test-renderer");
type SnapshotMap = Map<string, ScreenAnimationContextValue>;

let sourceIndex = 0;

mock.module("../providers/screen/animation/helpers/pipeline", () => ({
	useScreenAnimationPipeline: () => {
		const pipelineRef = useRef<{
			screenInterpolatorProps: { get: () => ScreenInterpolatorFrame };
			screenInterpolatorFrameUpdater: { get: () => number };
			nextInterpolator: undefined;
			currentInterpolator: undefined;
		} | null>(null);

		if (!pipelineRef.current) {
			sourceIndex += 1;
			const frame = {
				current: {
					route: {
						key: `screen-${sourceIndex}`,
					},
				},
			} as ScreenInterpolatorFrame;

			pipelineRef.current = {
				screenInterpolatorProps: {
					get: () => frame,
				},
				screenInterpolatorFrameUpdater: {
					get: () => 0,
				},
				nextInterpolator: undefined,
				currentInterpolator: undefined,
			};
		}

		return pipelineRef.current;
	},
}));

let act: TestRenderer["act"];
let create: TestRenderer["create"];
let ScreenAnimationProvider: React.FC<{ children: ReactNode }>;
let useScreenAnimationContext: () => ScreenAnimationContextValue;

const captureDescendants = (context: ScreenAnimationContextValue) =>
	context.descendantScreenAnimationSources.get().map(({ source, depth }) => {
		const frame = source.screenInterpolatorProps.get();
		return `${frame.current.route.key}:${depth}`;
	});

const Snapshot = ({
	id,
	onSnapshot,
}: {
	id: string;
	onSnapshot: (id: string, context: ScreenAnimationContextValue) => void;
}) => {
	const context = useScreenAnimationContext();

	useLayoutEffect(() => {
		onSnapshot(id, context);
	});

	return null;
};

const createProviderTree = ({
	showChild,
	showGrandchild,
	onSnapshot,
}: {
	showChild: boolean;
	showGrandchild: boolean;
	onSnapshot: (id: string, context: ScreenAnimationContextValue) => void;
}) =>
	React.createElement(
		ScreenAnimationProvider,
		null,
		React.createElement(Snapshot, { id: "root", onSnapshot }),
		showChild
			? React.createElement(
					ScreenAnimationProvider,
					null,
					React.createElement(Snapshot, { id: "child", onSnapshot }),
					showGrandchild
						? React.createElement(
								ScreenAnimationProvider,
								null,
								React.createElement(Snapshot, {
									id: "grandchild",
									onSnapshot,
								}),
							)
						: null,
				)
			: null,
	);

describe("ScreenAnimationProvider descendant registration", () => {
	beforeAll(async () => {
		globalThis.IS_REACT_ACT_ENVIRONMENT = true;

		const renderer = await import("react-test-renderer");
		const providerModule = await import(
			"../providers/screen/animation/animation.provider"
		);

		act = renderer.act;
		create = renderer.create;
		ScreenAnimationProvider = providerModule.ScreenAnimationProvider;
		useScreenAnimationContext = providerModule.useScreenAnimationContext;
	});

	beforeEach(() => {
		sourceIndex = 0;
	});

	it("registers descendants with every ancestor and cleans them up on unmount", async () => {
		const snapshots: SnapshotMap = new Map();
		const onSnapshot = (id: string, context: ScreenAnimationContextValue) => {
			snapshots.set(id, context);
		};

		let root: ReturnType<TestRenderer["create"]> | undefined;

		await act(async () => {
			root = create(
				createProviderTree({
					showChild: true,
					showGrandchild: true,
					onSnapshot,
				}),
			);
		});

		expect(captureDescendants(snapshots.get("root")!)).toEqual([
			"screen-2:1",
			"screen-3:2",
		]);
		expect(captureDescendants(snapshots.get("child")!)).toEqual([
			"screen-3:1",
		]);

		await act(async () => {
			root?.update(
				createProviderTree({
					showChild: true,
					showGrandchild: false,
					onSnapshot,
				}),
			);
		});

		expect(captureDescendants(snapshots.get("root")!)).toEqual([
			"screen-2:1",
		]);
		expect(captureDescendants(snapshots.get("child")!)).toEqual([]);

		await act(async () => {
			root?.update(
				createProviderTree({
					showChild: false,
					showGrandchild: false,
					onSnapshot,
				}),
			);
		});

		expect(captureDescendants(snapshots.get("root")!)).toEqual([]);

		await act(async () => {
			root?.unmount();
		});
	});
});
