import { sleep, Stack } from "../internal/mod.ts";
import { Lock } from "./lock.ts";

interface Waiter {
	w: boolean;
	resolve: () => void;
}

type ReleaseHandler = () => Promise<void>;

export class RwLock {
	private readonly lock: Lock;
	private writing = false;
	private readings = 0;
	private readonly waiters: Stack<Waiter>;

	constructor() {
		this.lock = new Lock();
		this.waiters = new Stack();
	}

	private async release_write() {
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

			this.readings++;
			top.resolve;
		} finally {
			this.lock.release();
		}
	}

	private async release_read() {
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

	async acquirew(): Promise<ReleaseHandler> {
		await this.lock.acquire();
		if (this.writing || this.readings) {
			await new Promise<void>((resolve) => {
				this.waiters.push({ resolve, w: true });
				this.lock.release();
			});
			return this.release_write.bind(this);
		}
		this.writing = true;
		this.lock.release();
		return this.release_write.bind(this);
	}

	async acquirer(): Promise<ReleaseHandler> {
		await this.lock.acquire();
		if (this.writing) {
			await new Promise<void>((resolve) => {
				this.waiters.push({ resolve, w: false });
				this.lock.release();
			});
			return this.release_read.bind(this);
		}
		this.readings++;
		this.lock.release();
		return this.release_read.bind(this);
	}

	private async within<T, Args>(w: boolean, fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
		let handler: ReleaseHandler | undefined;
		try {
			if (w) {
				handler = await this.acquirew();
			} else {
				handler = await this.acquirer();
			}
			return (await fn(args));
		} finally {
			if (handler) {
				await handler();
			}
		}
	}

	async withinw<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
		return await this.within(true, fn, args);
	}

	async withinr<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
		return await this.within(false, fn, args);
	}
}

if (import.meta.main) {
	const lock = new RwLock();

	async function test_routine(idx: number) {
		await lock.withinr(async () => {
			await sleep(10);
			console.log(idx, Date.now());
		});
	}

	const ps = [] as Array<Promise<void>>;

	for (let i = 0; i < 100; i++) {
		ps.push(test_routine(i));
	}

	await Promise.all(ps);
}
