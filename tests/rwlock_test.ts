import { sleep } from "../src/index.js";
import { RwLock } from "../src/pkgs/sync/rwlock.js";

const lock = new RwLock();

const ps = [] as Promise<void>[];
for (let i = 0; i < 10; i++) {
	ps.push(
		(async (idx: number) => {
			await using _ = await lock.acquirew();
			await sleep(100);
			console.log("W", idx, Date.unix());
		})(i),
	);
}

await Promise.all(ps);

ps.length = 0;
for (let i = 0; i < 100; i++) {
	ps.push(
		(async (idx: number) => {
			await using _ = await lock.acquirer();
			await sleep(100);
			console.log("R", idx, Date.unix());
		})(i),
	);
}

await Promise.all(ps);

console.log(lock);
