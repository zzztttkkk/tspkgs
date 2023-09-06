import { Stack } from "./stack.ts";
import { OnExit } from "./death.ts";
import * as fs from "./fs.ts";
import * as clsvld from "clsvld/mod.ts";
import * as vldext from "./vld_exts.ts";

export { fs, OnExit, Stack };

export async function sleep(ms: number) {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

export const vld = {
	...clsvld,
	...vldext,
};
