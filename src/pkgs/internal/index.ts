import "./globals/index.js"; // must be first

import path from "path";
import url from "url";
import { Stack } from "./stack.js";
import { Hole } from "./hole.js";
import { inspect } from "util";
import * as __ from "./__/index.js";
import * as fs from "fs/promises";

export { Stack, Hole, __ };

const ProcessEntry = path.resolve(process.argv[1]);
export function ismain(meta: ImportMeta): boolean {
	return path.resolve(url.fileURLToPath(meta.url)) === ProcessEntry;
}

export function source(meta: ImportMeta): string {
	return path.resolve(url.fileURLToPath(meta.url));
}

export function sourcedir(meta: ImportMeta): string {
	return path.dirname(source(meta));
}

export async function projectroot(meta: ImportMeta): Promise<string> {
	let cursor = sourcedir(meta);

	function next() {
		const cd = path.dirname(cursor);
		if (cd === cursor) {
			throw new Error(`Cannot find package.json by ${sourcedir(meta)}`);
		}
		cursor = path.dirname(cursor);
	}

	while (true) {
		try {
			const stat = await fs.stat(`${cursor}/package.json`);
			if (stat.isFile()) {
				return cursor;
			}
			next();
		} catch (e) {
			next();
		}
	}
}

export function sleep<T>(ms: number, v?: T): Promise<T | undefined> {
	if (ms < 1) {
		return new Promise((resolve) => setImmediate(() => resolve(v)));
	}
	return new Promise((resolve) => setTimeout(() => resolve(v), Math.ceil(ms)));
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
