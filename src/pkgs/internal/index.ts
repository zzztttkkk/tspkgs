import { Stack } from "./stack.js";
import * as process from "process";
import * as url from "url";
import * as path from "path";

export { Stack };

export async function sleep(ms: number) {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

export function ismain(meta: { url: string }): boolean {
	return (
		path.resolve(url.fileURLToPath(meta.url)) ===
		path.resolve(process.argv[1])
	);
}
