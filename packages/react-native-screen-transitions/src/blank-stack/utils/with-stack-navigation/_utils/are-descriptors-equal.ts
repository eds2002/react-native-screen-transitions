import type { BlankStackDescriptorMap } from "../../../types";

export const areDescriptorsEqual = (
  a: BlankStackDescriptorMap,
  b: BlankStackDescriptorMap
): boolean => {
  if (a === b) return true;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => a[key] === b[key]);
};
