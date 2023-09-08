import { lines } from "./lines.js";
import { content } from "./content.js";
import * as fs from "fs/promises";

export { lines, content };

export async function exists(fp: string): Promise<boolean> {
	return new Promise<boolean>((res) => {
		fs.stat(fp).then(
			() => res(true),
			() => res(false),
		);
	});
}
