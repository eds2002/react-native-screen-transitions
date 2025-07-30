import type { ParamListBase } from "@react-navigation/native";
import { Children, cloneElement, isValidElement, useMemo } from "react";
import { DEFAULT_SCREEN_OPTIONS } from "@/navigator/constants";
import type { TransitionAwareProps } from "@/types";

export const useModifyChildren = (children: React.ReactNode) => {
	return useMemo(() => {
		const modifiedChildren = Children.toArray(children)
			.filter(isValidElement<TransitionAwareProps<ParamListBase>>)
			.map((child) => {
				const resolvedOptions =
					typeof child.props.options === "function"
						? child.props.options({
								route: child.props.route,
								navigation: child.props.navigation,
							})
						: child.props.options || {};

				const skipDefaultScreenOptions =
					resolvedOptions?.skipDefaultScreenOptions === true;

				return cloneElement(child, {
					...child.props,
					options: {
						...(skipDefaultScreenOptions ? {} : DEFAULT_SCREEN_OPTIONS),
						...resolvedOptions,
					},
				});
			});

		return {
			children: modifiedChildren,
		};
	}, [children]);
};
