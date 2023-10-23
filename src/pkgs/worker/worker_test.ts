import { isMainThread, threadId } from "worker_threads";
import { sleep, source } from "../internal/index.js";
import { Work, TypedWorkerPool } from "./worker.js";

interface Params {
	a: number;
	b: number;
}

interface Result {
	sum: number;
	tid: number;
}

if (isMainThread) {
	const pool = new TypedWorkerPool<Params, Result>(10, source(import.meta));
	for (let i = 0; i < 100; i++) {
		pool.exec({ a: i, b: 4 }).then((v) => {
			console.log(`${i} + 4 = ${v.sum}, @ ${v.tid}`);
		});
	}

	await sleep(1000);

	process.exit(0);
} else {
	Work<Params, Result>(async (params) => {
		await sleep(Math.random() * 30);
		return { sum: params.a + params.b, tid: threadId };
	});
}
