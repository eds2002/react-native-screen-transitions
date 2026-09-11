import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";

// Bun's module mocks persist across files. Run each file in its own process so
// provider and native-module mocks cannot replace another file's dependencies.
const cwd = fileURLToPath(new URL("../", import.meta.url));
const files = Array.from(
	new Bun.Glob(
		"packages/react-native-screen-transitions/src/**/*.{test,spec}.{ts,tsx}",
	).scanSync({ cwd }),
).sort();
if (files.length === 0) throw new Error("No test files found");

const queue = files.values();
let failed = 0;
await Promise.all(
	Array.from(
		{ length: Math.min(4, availableParallelism(), files.length) },
		async () => {
			for (const file of queue) {
				const child = Bun.spawn([process.execPath, "test", file], {
					cwd,
					stdout: "pipe",
					stderr: "pipe",
				});
				const [exitCode, stdout, stderr] = await Promise.all([
					child.exited,
					new Response(child.stdout).text(),
					new Response(child.stderr).text(),
				]);
				if (exitCode !== 0) {
					failed++;
					console.error(`FAIL ${file}\n${stdout}${stderr}`);
				} else {
					console.log(`PASS ${file}`);
				}
			}
		},
	),
);
console.log(`\n${files.length - failed} test files passed, ${failed} failed.`);
process.exitCode = failed === 0 ? 0 : 1;
