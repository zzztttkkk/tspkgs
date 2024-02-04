export async function* asyncenumerate<Y, R, N>(
	inner: AsyncGenerator<Y, R, N>,
): AsyncGenerator<[number, Y], R, N> {
	let idx = 0;
	while (true) {
		const { value, done } = await inner.next();
		if (done) {
			return value;
		}
		yield [idx, value];
		idx++;
	}
}

export function* enumerate<Y, R, N>(
	inner: Generator<Y, R, N>,
): Generator<[number, Y], R, N> {
	let idx = 0;
	while (true) {
		const { value, done } = inner.next();
		if (done) {
			return value;
		}
		yield [idx, value];
		idx++;
	}
}
