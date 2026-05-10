import type { TagID } from "../types";

type GroupTag = {
	group: string;
	id: string;
};

export const parseGroupTag = (tag: string): GroupTag | null => {
	"worklet";
	const separatorIndex = tag.indexOf(":");
	if (separatorIndex === -1) return null;

	return {
		group: tag.slice(0, separatorIndex),
		id: tag.slice(separatorIndex + 1),
	};
};

export const createGroupTag = (group: string, id: string): TagID => {
	"worklet";
	return `${group}:${id}`;
};

export const getGroupName = (tagOrGroup: string): string => {
	"worklet";
	return parseGroupTag(tagOrGroup)?.group ?? tagOrGroup;
};
