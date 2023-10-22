import { isMainThread } from "worker_threads";
import { sleep, source } from "../internal/index.js";
import { TypedWorker, Work } from "./worker.js";

interface Params {
	a: number;
	b: number;
}

interface Result {
	sum: number;
}

if (isMainThread) {
	const worker = new TypedWorker<Params, Result>(source(import.meta));
	for (let i = 0; i < 100; i++) {
		worker.exec({ a: i, b: 4 }).then((v) => {
			console.log(`${i} + 4 = ${v.sum}`);
		});
	}

	await sleep(1000);

	process.exit(0);
} else {
	Work<Params, Result>(async (params) => {
		await sleep(Math.random() * 30);
		return { sum: params.a + params.b };
	});
}
