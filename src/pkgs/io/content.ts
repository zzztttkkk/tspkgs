import * as fs from "fs";
import { ismain } from "../internal/index.js";

export function content(fp: string, encoding: BufferEncoding): Promise<string>;
export function content(fp: string): Promise<Buffer>;

export function content(
	fp: string,
	encoding?: BufferEncoding,
): Promise<string | Buffer> {
	return new Promise<string | Buffer>((resolve, reject) => {
		fs.readFile(fp, (e, d) => {
			if (e) {
				reject(e);
				return;
			}
			if (encoding) {
				resolve(d.toString(encoding));
			} else {
				resolve(d);
			}
		});
	});
}

if (ismain(import.meta)) {
	const fc = await content("./package.json");
	console.log(fc);
}
