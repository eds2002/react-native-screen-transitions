import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MAESTRO_SUITES } from "../components/maestro/suites";

type ParsedSuite = {
	id: string;
	title: string;
	cases: string[];
};

const root = resolve(import.meta.dir, "..");
const suitesMarkdownPath = resolve(root, ".maestro/suites.md");
const maestroFlowPath = resolve(root, ".maestro/maestro-suite.yaml");

function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function parseSuitesMarkdown(markdown: string): ParsedSuite[] {
	const suites: ParsedSuite[] = [];
	let current: ParsedSuite | undefined;

	for (const line of markdown.split(/\r?\n/)) {
		const heading = line.match(/^##\s+(.+)$/);
		if (heading) {
			current = {
				id: slugify(heading[1]),
				title: heading[1],
				cases: [],
			};
			suites.push(current);
			continue;
		}

		const checkedItem = line.match(/^- \[ \]\s+(.+)$/);
		if (checkedItem && current) {
			current.cases.push(checkedItem[1]);
		}
	}

	return suites;
}

function fail(message: string): never {
	throw new Error(`[maestro-suite] ${message}`);
}

const expectedSuites = parseSuitesMarkdown(
	readFileSync(suitesMarkdownPath, "utf8"),
);
const actualSuites = MAESTRO_SUITES.map((suite) => ({
	id: suite.id,
	title: suite.title,
	cases: [...suite.cases],
}));

if (JSON.stringify(actualSuites) !== JSON.stringify(expectedSuites)) {
	fail(
		`${actualSuites.length} app suites do not match ${expectedSuites.length} suites in .maestro/suites.md`,
	);
}

const flow = readFileSync(maestroFlowPath, "utf8");

const openLinks = Array.from(
	flow.matchAll(/openLink:\s+"(e2e:\/\/\/[^"]+)"/g),
	(match) => match[1],
);

if (openLinks.length === 0) {
	fail("Maestro flow does not open any deep-linked scenario routes");
}

for (const link of openLinks) {
	if (!link.startsWith("e2e:///maestro/")) {
		fail(`Maestro flow opens non-fixture route: ${link}`);
	}
}

if (openLinks.includes("e2e:///maestro")) {
	fail("Maestro flow opens the fixture index instead of a concrete scenario");
}

if (flow.includes("maestro-detail-")) {
	fail("Maestro flow asserts checklist detail pages instead of real scenarios");
}

for (const suite of actualSuites) {
	if (!flow.includes(`# Suite: ${suite.id}`)) {
		fail(`Maestro flow does not include ${suite.id}`);
	}
}

const caseCount = actualSuites.reduce(
	(total, suite) => total + suite.cases.length,
	0,
);

console.log(
	`Verified ${actualSuites.length} Maestro suites and ${caseCount} checklist items.`,
);
