import {ismain} from "./internal/index.js";

export async function* asyncenumerate<Y, R, N>(inner: AsyncGenerator<Y, R, N>): AsyncGenerator<[number, Y], R, N> {
	let idx = 0;
	while (true) {
		const {value, done} = await inner.next();
		if (done) {
			return value;
		}
		yield [idx, value];
		idx++;
	}
}


export function* enumerate<Y, R, N>(inner: Generator<Y, R, N>): Generator<[number, Y], R, N> {
	let idx = 0;
	while (true) {
		const {value, done} = inner.next();
		if (done) {
			return value;
		}
		yield [idx, value];
		idx++;
	}
}


if (ismain(import.meta)) {
	function* lst<T>(v: T[]) {
		yield* v;
	}

	for (const [idx, ele] of enumerate(lst(["a", "b", "c", "d"]))) {
		console.log(idx, ele);
	}
}
