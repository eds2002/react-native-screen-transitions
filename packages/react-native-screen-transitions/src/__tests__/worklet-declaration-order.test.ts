import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

/**
 * A worklet captures the module bindings it uses when it is created; one declared at module level
 * is created while its module evaluates. A `const` declared further down is not initialized then:
 * Release Hermes doesn't enforce the temporal dead zone, so the worklet holds `undefined` and
 * throws on the UI thread when it calls it (an abort in Release). Tests run worklets as plain JS,
 * where the binding is live, so only this check sees it.
 */
const SRC = join(import.meta.dir, "..");

const sourceFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory())
			return entry.name === "__tests__" ? [] : sourceFiles(path);
		return /\.tsx?$/.test(entry.name) ? [path] : [];
	});

const isWorklet = (node: ts.Node): node is ts.FunctionLikeDeclaration => {
	if (
		!ts.isArrowFunction(node) &&
		!ts.isFunctionExpression(node) &&
		!ts.isFunctionDeclaration(node)
	)
		return false;
	const first = node.body && ts.isBlock(node.body) && node.body.statements[0];
	return (
		!!first &&
		ts.isExpressionStatement(first) &&
		ts.isStringLiteral(first.expression) &&
		first.expression.text === "worklet"
	);
};

const isValueReference = (id: ts.Identifier) => {
	const parent = id.parent;
	if (ts.isPropertyAccessExpression(parent) && parent.name === id) return false;
	if (ts.isPropertyAssignment(parent) && parent.name === id) return false;
	return !ts.isTypeReferenceNode(parent) && !ts.isTypeQueryNode(parent);
};

const forwardReferences = (file: string) => {
	const source = ts.createSourceFile(
		file,
		readFileSync(file, "utf8"),
		ts.ScriptTarget.Latest,
		true,
	);
	const declaredAt = new Map<string, number>();
	source.statements.forEach((statement, index) => {
		if (ts.isVariableStatement(statement)) {
			for (const d of statement.declarationList.declarations)
				if (ts.isIdentifier(d.name)) declaredAt.set(d.name.text, index);
		} else if (
			(ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
			statement.name
		) {
			declaredAt.set(statement.name.text, index);
		}
	});

	const found: string[] = [];
	source.statements.forEach((statement, index) => {
		// Worklets created during module evaluation: not inside another (non-worklet) function.
		const visit = (node: ts.Node) => {
			if (isWorklet(node)) {
				const scan = (inner: ts.Node) => {
					if (
						ts.isIdentifier(inner) &&
						(declaredAt.get(inner.text) ?? -1) > index &&
						isValueReference(inner)
					) {
						const line = source.getLineAndCharacterOfPosition(inner.getStart()).line;
						found.push(`${relative(SRC, file)}:${line + 1} ${inner.text}`);
					}
					ts.forEachChild(inner, scan);
				};
				if (node.body) ts.forEachChild(node.body, scan);
				return;
			}
			if (ts.isFunctionLike(node)) return;
			ts.forEachChild(node, visit);
		};
		visit(statement);
	});
	return found;
};

describe("module-level worklets", () => {
	it("only call module bindings declared above them", () => {
		expect(sourceFiles(SRC).flatMap(forwardReferences)).toEqual([]);
	});
});
