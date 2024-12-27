import { ismain, sleep } from "../index.js";

class AbortedError extends Error { }

function NewWithAbortSignal<T>(abortsignal: AbortSignal | undefined): { resolve: (val: T) => void; reject: (err: any) => void; promise: Promise<T> } {
	let res: (val: T) => void;
	let rej: (err: any) => void;
	const ps = new Promise<T>((resolve, reject) => {
		res = resolve;
		rej = reject;
		if (abortsignal) {
			abortsignal.addEventListener("abort", () => rej(new AbortedError("aborted")));
		}
	});
	return {
		resolve: res!,
		reject: rej!,
		promise: ps
	};
}

declare global {
	interface PromiseConstructor {
		NewWithAbortSignal<T>(abortsignal: AbortSignal | undefined): { resolve: (val: T) => void; reject: (err: any) => void; promise: Promise<T> }
	}
}

Object.defineProperty(Promise, "NewWithAbortSignal", { value: NewWithAbortSignal, writable: false, })

if (ismain(import.meta)) {
	const ac = new AbortController();
	const { promise } = Promise.NewWithAbortSignal<void>(ac.signal);
	sleep(1000).then(() => ac.abort());
	await promise;
}