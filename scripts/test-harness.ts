import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";

// The harness tests (src/__tests__/harness) replace Reanimated with a frame-stepping simulator for
// their whole file, which a shared process can't undo for library modules that are already loaded.
// bunfig.toml keeps them out of `bun test`; this runs each in its own process.
const cwd = fileURLToPath(new URL("../", import.meta.url));
const files = Array.from(
	new Bun.Glob(
		"packages/react-native-screen-transitions/src/__tests__/harness/**/*.test.{ts,tsx}",
	).scanSync({ cwd }),
).sort();
if (files.length === 0) throw new Error("No harness test files found");

const queue = files.values();
let failed = 0;
await Promise.all(
	Array.from(
		{ length: Math.min(4, availableParallelism(), files.length) },
		async () => {
			for (const file of queue) {
				const child = Bun.spawn(
					[
						process.execPath,
						"test",
						"--path-ignore-patterns=**/__none__/**",
						`./${file}`,
					],
					{ cwd, stdout: "pipe", stderr: "pipe" },
				);
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
console.log(
	`\n${files.length - failed} harness test files passed, ${failed} failed.`,
);
process.exitCode = failed === 0 ? 0 : 1;
