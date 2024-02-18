import { isMainThread, threadId } from "worker_threads";
import { source } from "../internal/index.js";
import { Work, TypedWorkerPool } from "./worker.js";
import { cpus } from "os";

interface Params {
	a: number;
	b: number;
}

interface Result {
	sum: number;
	tid: number;
}

if (isMainThread) {
	const pool = new TypedWorkerPool<Params, Result>(
		cpus().length,
		source(import.meta),
	);
	const ps = [] as Promise<any>[];
	for (let i = 0; i < 100; i++) {
		ps.push(
			pool.exec({ a: i, b: 4 }, {}).then((v) => {
				console.log(`${i} + 4 = ${v.sum}, @ ${v.tid}`);
			}),
		);
	}

	await Promise.all(ps);
	process.exit(0);
} else {
	Work<Params, Result>(async (params, hooks) => {
		hooks.OnCanceled(() => {
			console.log("cancel");
		});
		hooks.OnTimeouted(() => {
			console.log("timeout");
		});
		return { sum: params.a + params.b, tid: threadId };
	});
}
