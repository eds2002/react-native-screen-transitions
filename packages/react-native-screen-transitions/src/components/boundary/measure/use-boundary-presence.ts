import { useLayoutEffect } from "react";
import type { BoundTag } from "../../../stores/bounds";
import type { BoundaryConfigProps } from "../types";
import { queueEntryOp } from "./measure-registry";

/**
 * The link keys of the boundaries mounted on each screen, on the JS side: a boundary arriving as a
 * pair's destination reads whether the screen below has its partner while it renders, before the
 * UI-thread registry hears of it (see useArrivesLinked).
 */
const presentLinks = new Map<string, Map<string, number>>();

const countPresentLink = (
	screenKey: string,
	linkKey: string,
	delta: 1 | -1,
) => {
	let links = presentLinks.get(screenKey);
	if (!links) {
		if (delta < 0) return;
		links = new Map();
		presentLinks.set(screenKey, links);
	}
	const count = (links.get(linkKey) ?? 0) + delta;
	if (count > 0) links.set(linkKey, count);
	else links.delete(linkKey);
	if (!links.size) presentLinks.delete(screenKey);
};

/** Whether a boundary with this link key is mounted on the screen. */
export const hasPresentLink = (screenKey: string, linkKey: string) =>
	!!presentLinks.get(screenKey)?.has(linkKey);

export const useBoundaryPresence = (params: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
	handoff?: boolean;
}) => {
	const { enabled, boundTag, currentScreenKey, boundaryConfig, handoff } =
		params;
	const { tag, linkKey } = boundTag;

	useLayoutEffect(() => {
		if (!enabled) return;
		countPresentLink(currentScreenKey, linkKey, 1);
		return () => countPresentLink(currentScreenKey, linkKey, -1);
	}, [enabled, linkKey, currentScreenKey]);

	useLayoutEffect(() => {
		if (!enabled) return;

		queueEntryOp({
			tag,
			screenKey: currentScreenKey,
			patch: {
				boundaryConfig,
				handoff: handoff ? true : null,
			},
		});

		return () => {
			queueEntryOp({ tag, screenKey: currentScreenKey, remove: true });
		};
	}, [enabled, tag, currentScreenKey, boundaryConfig, handoff]);
};
