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

export class TraceObject {
	#name: string;

	constructor(name: string) {
		this.#name = name;
	}

	[inspect.custom]() {
		const stack = new Error().stack;
		let line: string | undefined;
		if (stack) {
			const lines = stack.split("\n").map((v) => v.trim());
			let idx = 0;
			for (; idx < lines.length; idx++) {
				const v = lines[idx];
				if (v.startsWith(`at console.log`)) {
					break;
				}
			}

			line = lines[idx + 1];
		}
		line = line || "";
		if (line.startsWith("at ")) line = line.substring(3);
		return `[ Trace ${this.#name} ${Date.now()} @ \`${line}\` ]`;
	}

	static readonly A = new TraceObject("A");
	static readonly B = new TraceObject("B");
	static readonly C = new TraceObject("C");
	static readonly D = new TraceObject("D");
	static readonly E = new TraceObject("E");
	static readonly F = new TraceObject("F");
}
