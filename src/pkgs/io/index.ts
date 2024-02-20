import { content } from "./content.js";
import { Reader } from "./reader.js";
import * as glob from "glob";
import url from "url";
import fs from "fs/promises";
import { lines } from "./lines.js";

export { content, Reader, lines };

export async function importall(patterns: string[]): Promise<any[]> {
	const files = await glob.glob(patterns, { absolute: true });
	const modules = [] as any[];
	for (const fp of files) {
		if (!fp.endsWith(".js")) continue;
		const module = await import(url.pathToFileURL(fp).toString());
		modules.push(module);
	}
	return modules;
}

export async function exists(fp: string): Promise<boolean> {
	try {
		await fs.stat(fp);
		return true;
	} catch (e) {
		return false;
	}
}
