import { Stack } from "./stack.ts";
import { OnExit } from "./death.ts";
import * as fs from "./fs.ts";
import * as clsvld from "clsvld/mod.ts";
import * as vldext from "./vld_exts.ts";
import { Hole } from "./hole.ts";

export { fs, Hole, OnExit, Stack };

export async function sleep(ms: number) {
	return await new Promise<void>((resolve) => {
		setTimeout(resolve, Math.floor(ms));
	});
}

export const vld = {
	...clsvld,
	...vldext,
};
