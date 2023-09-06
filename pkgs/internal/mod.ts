import { Stack } from "./stack.ts";
import { OnExit } from "./death.ts";
import * as fs from "./fs.ts";

export { fs, OnExit, Stack };

export async function sleep(ms: number) {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}
