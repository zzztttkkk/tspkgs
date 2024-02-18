import { isMainThread, threadId } from "worker_threads";
import { cpus } from "os";
import { TypedWorkerPool, Work } from "../src/pkgs/worker/worker.js";
import { source } from "../src/pkgs/internal/index.js";

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
			pool.exec({ a: i, b: 4 }).then((v) => {
				console.log(`${i} + 4 = ${v.sum}, @ Thread ${v.tid}`);
			}),
		);
	}

	await Promise.all(ps);
	process.exit(0);
} else {
	Work<Params, Result>(async (params) => {
		return { sum: params.a + params.b, tid: threadId };
	});
}
