import type { Route } from "@react-navigation/native";

import type { NativeStackDescriptorMap } from "../../../types/native-stack.navigator";

export const getModalRouteKeys = (
  routes: Route<string>[],
  descriptors: NativeStackDescriptorMap
) =>
  routes.reduce<string[]>((acc, route) => {
    const { presentation } = descriptors[route.key]?.options ?? {};

    if (
      (acc.length && !presentation) ||
      presentation === "modal" ||
      presentation === "transparentModal"
    ) {
      acc.push(route.key);
    }

    return acc;
  }, []);
