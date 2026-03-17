import DocItemLayout from "@theme-original/DocItem/Layout";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CopyPageDropdown from "../../../components/CopyPageDropdown";

type Props = typeof DocItemLayout extends React.ComponentType<infer P>
	? P
	: never;

/**
 * Injects the CopyPageDropdown next to the h1 title element.
 * We portal into a wrapper appended right after the h1, inside the header.
 */
function CopyPageInTitle() {
	const [container, setContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		// Find the h1 inside .theme-doc-markdown header
		const h1 = document.querySelector(".theme-doc-markdown header h1");
		if (!h1) return;

		// Wrap h1 + portal in a flex row container
		const parent = h1.parentElement;
		if (!parent) return;

		// Check if we already have a wrapper
		let wrapper = parent.querySelector(".doc-title-row") as HTMLElement | null;
		if (!wrapper) {
			wrapper = document.createElement("div");
			wrapper.className = "doc-title-row";
			// Insert the wrapper before the h1, then move h1 into it
			parent.insertBefore(wrapper, h1);
			wrapper.appendChild(h1);

			// Create the portal target
			const portalTarget = document.createElement("div");
			portalTarget.className = "doc-copy-page-portal";
			wrapper.appendChild(portalTarget);
		}

		const portalTarget = wrapper.querySelector(
			".doc-copy-page-portal",
		) as HTMLElement | null;
		setContainer(portalTarget);

		return () => {
			// On cleanup, move h1 back and remove wrapper
			if (wrapper && wrapper.parentElement) {
				const h1Inside = wrapper.querySelector("h1");
				if (h1Inside) {
					wrapper.parentElement.insertBefore(h1Inside, wrapper);
				}
				wrapper.remove();
			}
		};
	}, []);

	if (!container) return null;
	return createPortal(<CopyPageDropdown />, container);
}

export default function DocItemLayoutWrapper(props: Props) {
	return (
		<div>
			{/* @ts-expect-error Docusaurus swizzle wrapper */}
			<DocItemLayout {...props} />
			<CopyPageInTitle />
		</div>
	);
}
