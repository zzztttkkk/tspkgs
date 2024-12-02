export async function* asyncenumerate<Y>(
	inner: AsyncGenerator<Y>,
): AsyncGenerator<[number, Y]> {
	let idx = 0;
	const tmp = [0, undefined] as [number, Y];
	for await (const ele of inner) {
		tmp[0] = idx;
		tmp[1] = ele;
		yield tmp;
		idx++;
	}
}

export function* enumerate<Y>(inner: Generator<Y>): Generator<[number, Y]> {
	let idx = 0;
	const tmp = [0, undefined] as [number, Y];
	for (const ele of inner) {
		tmp[0] = idx;
		tmp[1] = ele;
		yield tmp;
		idx++;
	}
}
