export function Any<T>(
	ary: Iterable<T>,
	cond?: (e: T, idx: number) => boolean,
): boolean {
	cond = cond || ((v) => !!v);

	let i = 0;
	for (const ele of ary) {
		if (cond(ele, i)) return true;
		i++;
	}
	return false;
}

export function All<T>(
	ary: Iterable<T>,
	cond?: (e: T, idx: number) => boolean,
): boolean {
	cond = cond || ((v) => !!v);

	let i = 0;
	for (const ele of ary) {
		if (!cond(ele, i)) return false;
		i++;
	}
	return true;
}

export function Count<T>(
	ary: Iterable<T>,
	cond?: (e: T, idx: number) => boolean,
): number {
	cond = cond || ((v) => !!v);

	let c = 0;
	let i = 0;
	for (const ele of ary) {
		if (cond(ele, i)) {
			c++;
		}
		i++;
	}
	return c;
}
