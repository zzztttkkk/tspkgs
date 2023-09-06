import { sleep, Stack } from "../internal/mod.ts";

type Waiter = () => void;

export class Lock {
	private locked = false;
	private readonly waiters: Stack<Waiter>;

	constructor() {
		this.waiters = new Stack();
	}

	async acquire() {
		if (this.locked) {
			await new Promise<void>((resolve) => {
				this.waiters.push(resolve);
			});
			return;
		}
		this.locked = true;
	}

	release() {
		if (this.waiters.empty()) {
			this.locked = false;
			return;
		}
		this.waiters.pop()();
	}

	async within<T, Args>(
		fn: (args?: Args) => Promise<T> | T,
		args?: Args,
	): Promise<T> {
		try {
			await this.acquire();
			return await fn(args);
		} finally {
			this.release();
		}
	}
}

if (import.meta.main) {
	const lock = new Lock();

	async function test_routine(idx: number) {
		await lock.within(async () => {
			await sleep(Math.random() * 30);
			console.log(idx, Date.now());
		});
	}

	const ps = [] as Array<Promise<void>>;

	for (let i = 0; i < 100; i++) {
		ps.push(test_routine(i));
	}

	await Promise.all(ps);

	console.log(lock);
}
