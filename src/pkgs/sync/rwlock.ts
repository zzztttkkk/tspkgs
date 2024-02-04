import { Stack, ismain, sleep } from "../internal/index.js";
import { Lock } from "./lock.js";

interface Waiter {
	w: boolean;
	resolve: () => void;
}

export class RwLock {
	private readonly lock: Lock;
	private writing = false;
	private readings = 0;
	private readonly waiters: Stack<Waiter>;

	constructor() {
		this.lock = new Lock();
		this.waiters = new Stack();
	}

	async releasew() {
		await this.lock.acquire();
		try {
			if (this.waiters.empty()) {
				this.writing = false;
				return;
			}

			const top = this.waiters.pop();
			if (top.w) {
				top.resolve();
				return;
			}

			this.writing = false;
			this.readings++;
			top.resolve();
		} finally {
			this.lock.release();
		}
	}

	async releaser() {
		await this.lock.acquire();
		try {
			if (this.waiters.empty()) {
				this.readings--;
				return;
			}
			if (this.waiters.peek().w) return;
			this.waiters.pop().resolve();
		} finally {
			this.lock.release();
		}
	}

	async acquirew(): Promise<void> {
		await this.lock.acquire();
		if (this.writing || this.readings) {
			await new Promise<void>((resolve) => {
				this.waiters.push({ resolve, w: true });
				this.lock.release();
			});
			return;
		}
		this.writing = true;
		this.lock.release();
	}

	async acquirer(): Promise<void> {
		await this.lock.acquire();
		if (this.writing) {
			await new Promise<void>((resolve) => {
				this.waiters.push({ resolve, w: false });
				this.lock.release();
			});
			return;
		}
		this.readings++;
		this.lock.release();
	}

	private async within<T, Args>(
		w: boolean,
		fn: (args?: Args) => Promise<T> | T,
		args?: Args,
	): Promise<T> {
		try {
			if (w) {
				await this.acquirew();
			} else {
				await this.acquirer();
			}
			return await fn(args);
		} finally {
			if (w) {
				await this.releasew();
			} else {
				await this.releaser();
			}
		}
	}

	withinw<T, Args>(
		fn: (args?: Args) => Promise<T> | T,
		args?: Args,
	): Promise<T> {
		return this.within(true, fn, args);
	}

	withinr<T, Args>(
		fn: (args?: Args) => Promise<T> | T,
		args?: Args,
	): Promise<T> {
		return this.within(false, fn, args);
	}
}

if (ismain(import.meta)) {
	const lock = new RwLock();

	let c = 0;

	async function test_routine(idx: number) {
		await sleep(Math.random() * 20);

		await lock.acquirer();
		if (c !== 0) {
			await lock.releaser();
			console.log("r", idx, c);
			return;
		}
		await lock.releaser();

		await lock.withinw(async () => {
			await sleep(Math.random() * 10);
			if (c === 0) c += 1;
			console.log("w", idx, c);
		});
	}

	const ps = [] as Array<Promise<void>>;

	for (let i = 0; i < 100; i++) {
		ps.push(test_routine(i));
	}

	await Promise.all(ps);
}
