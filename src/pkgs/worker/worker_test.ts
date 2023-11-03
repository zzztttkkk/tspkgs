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
		pool
			.exec({ a: i, b: 4 }, { Timeout: 100 })
			.then((v) => {
				console.log(`${i} + 4 = ${v.sum}, @ ${v.tid}`);
			})
			.catch((e) => {});
	}

	await sleep(1000);

	process.exit(0);
} else {
	Work<Params, Result>(async (params, hooks) => {
		let loop = true;

		hooks.OnCanceled(() => {
			console.log("cancel");
			loop = false;
		});
		hooks.OnTimeouted(() => {
			console.log("timeout");
			loop = false;
		});

		while (loop) {
			await sleep(Math.random() * 3000);
		}
		return { sum: params.a + params.b, tid: threadId };
	});
}
