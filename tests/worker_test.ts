import { threadinds } from "../src/index.js";
import { sleep, source } from "../src/pkgs/internal/index.js";

interface Params {
	a: number;
	b: number;
}

interface Result {
	sum: number;
	tid: number;
}

if (threadinds.ismain()) {
	const pool = new threadinds.TypedWorkerPool<Params, Result>(
		-1,
		source(import.meta),
	);
	const ps = [] as Promise<any>[];
	for (let i = 0; i < 1000; i++) {
		ps.push(
			pool
				.exec({ a: i, b: 4 }, { Timeout: 500 })
				.then((v) => {
					console.log(`${i} + 4 = ${v.sum}, @ Thread ${v.tid}`);
				})
				.catch((e) => {
					console.log(`${i}`, (e as Error).message);
				}),
		);
	}

	await Promise.all(ps);
	process.exit(0);
} else {
	threadinds.exec<Params, Result>(async (params) => {
		await sleep(80);
		return { sum: params.a + params.b, tid: threadinds.id() };
	});
}
