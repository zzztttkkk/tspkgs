export async function* asyncenumerate<Y>(
	inner: AsyncGenerator<Y>,
): AsyncGenerator<[number, Y]> {
	let idx = 0;
	for await (const ele of inner) {
		yield [idx, ele];
		idx++;
	}
}

export function* enumerate<Y>(inner: Generator<Y>): Generator<[number, Y]> {
	let idx = 0;
	for (const ele of inner) {
		yield [idx, ele];
		idx++;
	}
}
