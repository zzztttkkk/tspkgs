import { content } from "./content.js";
import * as fs from "fs";
import * as path from "path";
import { Reader } from "./readbuffer.js";
import * as glob from "glob";
import * as url from "url";
import { ismain, sourcedir } from "../internal/index.js";

export { content, Reader };

export async function exists(fp: string): Promise<boolean> {
	return new Promise<boolean>((res) => {
		fs.stat(fp, (e) => {
			if (e != null) {
				res(false);
				return;
			}
			res(true);
		});
	});
}

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

if (ismain(import.meta)) {
	const ms = await importall([
		`${path.dirname(sourcedir(import.meta))}/sync/**/*.js`,
	]);
	for (const m of ms) {
		console.log(m);
	}
}
