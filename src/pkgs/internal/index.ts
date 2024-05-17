import path from "path";
import url from "url";
import { Stack } from "./stack.js";
import { Hole } from "./hole.js";
import { inspect } from "util";
import * as __ from "./__/index.js";
import "./globals/index.js";
import deasync from "deasync";

export { Stack, Hole, __ };

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

const OnShutdownHooks = [] as { name: string; fn: () => Promise<void> }[];
export function RegisterOnShutdown(name: string, fn: () => Promise<void>) {
	OnShutdownHooks.push({ name, fn });
}

let shutdown_called = false;
function shutdown() {
	if (shutdown_called) return;
	shutdown_called = true;

	console.log("PID", process.pid);

	let c = 0;
	for (const hook of OnShutdownHooks) {
		console.log(hook.fn.toString());

		const catchfn = ((name: string) => {
			return (e: any) => {
				console.error("ShutdownHookExecFailed:", name, e);
			};
		})(hook.name);

		hook
			.fn()
			.catch(catchfn)
			.finally(() => {
				c++;
			});
	}
	deasync.loopWhile(() => c < OnShutdownHooks.length);
}

process.on("exit", shutdown);
process.on("beforeExit", shutdown);
