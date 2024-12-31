import { inspect } from "node:util";
import { ismain, sleep } from "../internal/index.js";
import { Stack } from "../internal/stack.js";

type Waiter = () => void;

export const ErrLockIsFree = new Error("the lock is free");

export class Lock implements Disposable {
	private locked = false;
	private readonly waiters: Stack<Waiter>;

	constructor() {
		this.waiters = new Stack();
	}

	async acquire() {
		if (this.locked) {
			await new Promise<void>((resolve) => this.waiters.push(resolve));
		} else {
			this.locked = true;
		}
		return this;
	}

	release() {
		if (!this.locked) throw ErrLockIsFree;

		if (this.waiters.empty()) {
			this.locked = false;
			return;
		}
		this.waiters.pop()();
	}

	[Symbol.dispose](): void {
		this.release();
	}

	[inspect.custom]() {
		return `[Lock locked: ${this.locked}, waiters: ${this.waiters.depth}]`;
	}

	async exec<T>(ps: (() => Promise<T>)): Promise<T> {
		using _ = await this.acquire();
		return await ps();
	}
}

if (ismain(import.meta)) {
	const lock = new Lock();

	async function test_routine(idx: number) {
		await lock.exec(async () => {
			await sleep(Math.random() * 10);
			if (Math.random() >= 0.85) {
				throw new Error(`0.0`);
			}
			console.log(idx, Date.now(), lock);
		})
	}

	const ps = [] as Array<Promise<void>>;

	for (let i = 0; i < 100; i++) {
		ps.push(test_routine(i));
	}

	await Promise.allSettled(ps);

	console.log(lock);
}
