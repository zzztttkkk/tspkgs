import { ismain } from "../internal/index.js";
import * as crypto from "crypto";

export function choice<T>(array: T[]): T {
	if (array.length < 1) throw new Error(`empty array`);
	return array[Math.floor(Math.random() * array.length)];
}

export interface RandStringOptions {
	crypto?: boolean;
}

export function string(
	size: number,
	opts?: RandStringOptions,
): Promise<string> {
	const radix = 36;
	if (opts?.crypto) {
		return new Promise<string>((res, rej) => {
			crypto.randomBytes(size / 2 + 1, (e, buf) => {
				if (e) {
					rej(e);
					return;
				}
				res(buf.toString("hex").slice(0, size));
			});
		});
	}

	const val = Math.random().toString(radix).slice(2);
	if (val.length >= size) {
		return Promise.resolve(val.slice(0, size));
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
	return Promise.resolve(buf.join(""));
}

if (ismain(import.meta)) {
	console.log(await string(7, { crypto: true }));
}
