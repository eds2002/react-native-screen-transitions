import {
	Children,
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";

import { Step, type StepInjectedProps } from "./step";

export function Steps({ children }: { children: ReactNode }) {
	const items = Children.toArray(children).filter(Boolean);

	return (
		<ol className="m-0 list-none space-y-0 p-0">
			{items.map((child, index) => {
				if (isValidElement<StepInjectedProps>(child) && child.type === Step) {
					return cloneElement(child as ReactElement<StepInjectedProps>, {
						isLast: index === items.length - 1,
						stepNumber: index + 1,
					});
				}

				return child;
			})}
		</ol>
	);
}
