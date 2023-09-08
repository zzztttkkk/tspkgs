import path from "path";
import { fileURLToPath } from "url";
import { Stack } from "./stack.js";
import { Hole } from "./hole.js";
import * as vldext from "./vld_ext.js";
import * as vldcls from "class-validator";

export { Stack, Hole };

export function ismain(meta: ImportMeta): boolean {
	return (
		path.resolve(fileURLToPath(meta.url)) === path.resolve(process.argv[1])
	);
}

export function sleep(ms: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, Math.ceil(ms));
	});
}

export const vld = {
	...vldcls,
	...vldext,
};
