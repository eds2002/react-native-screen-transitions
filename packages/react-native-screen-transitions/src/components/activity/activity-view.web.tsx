/// <reference lib="dom" />

import { Activity, type ReactNode, useCallback } from "react";
import { StyleSheet, View } from "react-native";

export type ActivityViewMode = "normal" | "inert" | "paused";

interface ActivityViewProps {
	children: ReactNode;
	mode: ActivityViewMode;
	visible: boolean;
}

/**
 * Web Activity writes display:none directly to its host child. Observe that
 * write so lifecycle pausing and retained paint remain independent there too.
 */
export function ActivityView({ children, mode, visible }: ActivityViewProps) {
	const display = visible ? "flex" : "none";
	const activityMode = mode === "paused" ? "hidden" : "visible";
	const onRef = useCallback(
		(node: React.ComponentRef<typeof View> | null) => {
			if (!(node instanceof HTMLElement)) {
				return;
			}

			const childObservers: MutationObserver[] = [];
			const observeChildren = () => {
				for (const observer of childObservers) {
					observer.disconnect();
				}
				childObservers.length = 0;

				node.childNodes.forEach((child) => {
					if (!(child instanceof HTMLElement)) {
						return;
					}

					child.style.display = display;
					const observer = new MutationObserver(() => {
						child.style.display = display;
					});
					observer.observe(child, {
						attributes: true,
						attributeFilter: ["style"],
					});
					childObservers.push(observer);
				});
			};

			observeChildren();
			const observer = new MutationObserver(observeChildren);
			observer.observe(node, { childList: true });

			return () => {
				observer.disconnect();
				for (const childObserver of childObservers) {
					childObserver.disconnect();
				}
			};
		},
		[display],
	);

	return (
		<View ref={onRef} collapsable={false} style={styles.contents}>
			<Activity mode={activityMode}>
				<View collapsable={false} style={[styles.content, { display }]}>
					{children}
				</View>
			</Activity>
		</View>
	);
}

const styles = StyleSheet.create({
	contents: { display: "contents" },
	content: { flex: 1 },
});
