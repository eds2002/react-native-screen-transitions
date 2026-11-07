import { useLayoutEffect } from "react";
import type { BoundTag } from "../../../../stores/bounds";
import { queueEntryOp } from "../../coordinator/measure-registry";
import type { BoundaryConfigProps } from "../../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
	handoff?: boolean;
}) => {
	const { enabled, boundTag, currentScreenKey, boundaryConfig, handoff } =
		params;
	const { tag } = boundTag;

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
