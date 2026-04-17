import { Children, isValidElement, type ReactNode } from "react";

export function flattenReactText(value: ReactNode): string {
	return Children.toArray(value)
		.map((child) => {
			if (typeof child === "string" || typeof child === "number") {
				return String(child);
			}

			if (isValidElement<{ children?: ReactNode }>(child)) {
				return flattenReactText(child.props.children);
			}

			return "";
		})
		.join("");
}

export function slugifyHeading(value: string) {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}
