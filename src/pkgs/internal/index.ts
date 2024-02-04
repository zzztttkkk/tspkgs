import path from "path";
import * as url from "url";
import { Stack } from "./stack.js";
import { Hole } from "./hole.js";

export { Stack, Hole };

export function ismain(meta: ImportMeta): boolean {
	return (
		path.resolve(url.fileURLToPath(meta.url)) === path.resolve(process.argv[1])
	);
}

export function source(meta: ImportMeta): string {
	return path.resolve(url.fileURLToPath(meta.url));
}

export function sourcedir(meta: ImportMeta): string {
	return path.dirname(source(meta));
}

export function sleep(ms: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, Math.ceil(ms));
	});
}
