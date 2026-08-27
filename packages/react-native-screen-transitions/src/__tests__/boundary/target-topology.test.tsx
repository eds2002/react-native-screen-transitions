import { describe, expect, it } from "bun:test";
import {
	createElement,
	Fragment,
	type ReactNode,
} from "react";
import { resolveBoundaryTarget } from "../../components/boundary/utils/resolve-boundary-target";

type FixtureProps = {
	children?: ReactNode;
	name?: string;
};

function TargetFixture(_props: FixtureProps) {
	return null;
}

function BoundaryRootFixture({ children }: FixtureProps) {
	return children;
}

const resolveFixtureTarget = (children: ReactNode) =>
	resolveBoundaryTarget(children, {
		isTarget: (element) => element.type === TargetFixture,
	});

describe("declarative Boundary.Target resolution", () => {
	it("selects a direct target", () => {
		const target = createElement(TargetFixture, { name: "artwork" });
		const resolution = resolveFixtureTarget(target);

		expect(resolution.target).toBe(target);
		expect(resolution.targetCount).toBe(1);
	});

	it("walks fragments and child arrays", () => {
		const target = createElement(TargetFixture, { name: "fragment-target" });
		const children = createElement(
			Fragment,
			null,
			[
				createElement("view", { key: "before" }),
				createElement(
					Fragment,
					{ key: "nested" },
					[target],
				),
			],
		);

		const resolution = resolveFixtureTarget(children);

		expect(resolution.target).toBe(target);
		expect(resolution.targetCount).toBe(1);
	});

	it("counts multiple targets while keeping the first in render order", () => {
		const first = createElement(TargetFixture, {
			key: "first",
			name: "first",
		});
		const second = createElement(TargetFixture, {
			key: "second",
			name: "second",
		});

		const resolution = resolveFixtureTarget([first, second]);

		expect(resolution.target).toBe(first);
		expect(resolution.targetCount).toBe(2);
	});

	it("does not claim targets owned by a nested boundary root", () => {
		const innerTarget = createElement(TargetFixture, { name: "inner" });
		const outerTarget = createElement(TargetFixture, {
			key: "outer",
			name: "outer",
		});
		const children = [
			createElement(
				BoundaryRootFixture,
				{ key: "inner-root" },
				innerTarget,
			),
			outerTarget,
		];

		const resolution = resolveFixtureTarget(children);

		expect(resolution.target).toBe(outerTarget);
		expect(resolution.targetCount).toBe(1);
	});
});
