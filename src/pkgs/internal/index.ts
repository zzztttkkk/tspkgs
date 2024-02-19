import path from "path";
import url from "url";
import { Stack } from "./stack.js";
import { Hole } from "./hole.js";
import { inspect } from "util";

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

// https://stackoverflow.com/a/1997811/6683474
const UniqueIdSymbal = Symbol("pkgs:internal:unique_id");
let UniqueIdSeq = BigInt(Math.floor(Math.random() * 10000));

export function UniqueId(v: object): BigInt {
	switch (typeof v) {
		case "object":
		case "function": {
			if (v == null) return BigInt(0);

			let pid: BigInt | undefined = (v as any)[UniqueIdSymbal];
			if (pid != null) {
				return pid;
			}
			pid = UniqueIdSeq++;
			Object.defineProperty(v, UniqueIdSymbal, {
				value: pid,
				enumerable: false,
				writable: false,
				configurable: false,
			});
			return pid;
		}
		default: {
			throw new Error(`${inspect(v)} is not an object`);
		}
	}
}
