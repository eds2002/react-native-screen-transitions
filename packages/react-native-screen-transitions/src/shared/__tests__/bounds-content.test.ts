import { describe, expect, it } from "bun:test";
import { computeBoundStyles } from "../utils/bounds/helpers/compute-bounds-styles";
import { createBounds } from "./helpers/bounds-behavior-fixtures";

const screenLayout = { width: 400, height: 800, scale: 1, fontScale: 1 };

const makeState = (key: string) =>
	({
		route: { key },
	}) as any;

describe('bounds({ method: "content" }) ownership', () => {
	it("grows the unfocused source screen toward the destination target", () => {
		const styles = computeBoundStyles(
			{
				id: "card",
				current: makeState("screen-a"),
				next: makeState("screen-b"),
				progress: 2,
				dimensions: screenLayout,
			},
			{
				id: "card",
				method: "content",
				raw: true,
				scaleMode: "uniform",
			},
			{
				sourceBounds: createBounds(10, 20, 100, 200),
				destinationBounds: createBounds(50, 100, 200, 400),
				sourceStyles: null,
				destinationStyles: null,
				sourceScreenKey: "screen-a",
				destinationScreenKey: "screen-b",
				usedPending: false,
				usedSnapshotSource: false,
				usedSnapshotDestination: false,
			},
		);

		expect(styles.scale).toBeCloseTo(2, 5);
	});

	it("supports fullscreen source-owned content targets without a destination bound", () => {
		const styles = computeBoundStyles(
			{
				id: "card",
				current: makeState("screen-a"),
				next: makeState("screen-b"),
				progress: 2,
				dimensions: screenLayout,
			},
			{
				id: "card",
				method: "content",
				target: "fullscreen",
				raw: true,
				scaleMode: "uniform",
			},
			{
				sourceBounds: createBounds(10, 20, 100, 200),
				destinationBounds: null,
				sourceStyles: null,
				destinationStyles: null,
				sourceScreenKey: "screen-a",
				destinationScreenKey: null,
				usedPending: false,
				usedSnapshotSource: false,
				usedSnapshotDestination: false,
			},
		);

		expect(styles.scale).toBeCloseTo(4, 5);
	});

	it("supports custom source-owned content targets without a destination bound", () => {
		const styles = computeBoundStyles(
			{
				id: "card",
				current: makeState("screen-a"),
				next: makeState("screen-b"),
				progress: 2,
				dimensions: screenLayout,
			},
			{
				id: "card",
				method: "content",
				target: createBounds(50, 100, 200, 400),
				raw: true,
				scaleMode: "uniform",
			},
			{
				sourceBounds: createBounds(10, 20, 100, 200),
				destinationBounds: null,
				sourceStyles: null,
				destinationStyles: null,
				sourceScreenKey: "screen-a",
				destinationScreenKey: null,
				usedPending: false,
				usedSnapshotSource: false,
				usedSnapshotDestination: false,
			},
		);

		expect(styles.scale).toBeCloseTo(2, 5);
	});

	it("does not invert targeted content when destination fallback reuses the current screen snapshot", () => {
		const styles = computeBoundStyles(
			{
				id: "card",
				current: makeState("screen-a"),
				next: makeState("screen-b"),
				progress: 2,
				dimensions: screenLayout,
			},
			{
				id: "card",
				method: "content",
				target: "fullscreen",
				raw: true,
				scaleMode: "uniform",
			},
			{
				sourceBounds: createBounds(10, 20, 100, 200),
				destinationBounds: createBounds(10, 20, 100, 200),
				sourceStyles: null,
				destinationStyles: null,
				sourceScreenKey: "screen-a",
				destinationScreenKey: "screen-a",
				usedPending: false,
				usedSnapshotSource: false,
				usedSnapshotDestination: true,
			},
		);

		expect(styles.scale).toBeCloseTo(4, 5);
	});

	it("keeps destination-owned close behavior shrinking back toward the source", () => {
		const styles = computeBoundStyles(
			{
				id: "card",
				current: makeState("screen-b"),
				next: makeState("screen-a"),
				progress: 2,
				dimensions: screenLayout,
			},
			{
				id: "card",
				method: "content",
				raw: true,
				scaleMode: "uniform",
			},
			{
				sourceBounds: createBounds(10, 20, 100, 200),
				destinationBounds: createBounds(50, 100, 200, 400),
				sourceStyles: null,
				destinationStyles: null,
				sourceScreenKey: "screen-a",
				destinationScreenKey: "screen-b",
				usedPending: false,
				usedSnapshotSource: false,
				usedSnapshotDestination: false,
			},
		);

		expect(styles.scale).toBeCloseTo(0.5, 5);
	});
});
