import { ismain } from "../internal/index.js";

export function choice<T>(array: T[]): T {
	if (array.length < 1) throw new Error(`empty array`);
	return array[Math.floor(Math.random() * array.length)];
}

export interface RandStringOptions {
	radix?: 16 | 36;
}

export function string(size: number, opts?: RandStringOptions): string {
	const radix = opts?.radix || 36;
	const val = Math.random().toString(radix).slice(2);
	if (val.length >= size) {
		return val.slice(0, size);
	}

	const buf = [val] as string[];
	size -= val.length;
	while (true) {
		const tmp = Math.random().toString(radix).slice(2);
		if (tmp.length >= size) {
			buf.push(tmp.slice(0, size));
			break;
		}
		buf.push(tmp);
		size -= tmp.length;
	}
	return buf.join("");
}

if (ismain(import.meta)) {
	console.log(string(10, { radix: 16 }));
}
