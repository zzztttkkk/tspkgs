import { AllReflectInfos, type PropOptions, prop, Info } from "./props.js";
import * as process from "process";
import { parse as load } from "./parse.js";
import { ismain } from "../internal/index.js";
import { exists } from "../io/index.js";
import fs from "fs";

export { prop };

const InstanceCache = new Map<any, any>();

function get(
	obj: NodeJS.Dict<string>,
	k: string,
	opts: PropOptions,
): string | undefined {
	let keys = [k] as Array<string | undefined>;
	if (opts.aliases) {
		keys = keys.concat(opts.aliases);
	}

	if (opts.caseSensitive) {
		for (const key of keys) {
			if (!key) continue;
			const v = obj[key];
			if (typeof v === "string") {
				return v;
			}
		}
		return undefined;
	}

	keys = keys.filter((v) => Boolean(v)).map((v) => v!.toUpperCase());

	const tmp = {} as any;
	Object.keys(obj).forEach((k) => {
		tmp[k.toUpperCase()] = obj[k];
	});

	for (const key of keys) {
		const v = tmp[key!];
		if (typeof v === "string") {
			return v;
		}
	}
	return undefined;
}

const TRUTHES = ["true", "t", "T", "True", "TRUE", "ok", "yes", "1"];

if (await exists(".env")) {
	await load(".env");
}
if (await exists(".env.local")) {
	await load(".env.local");
}

export async function Get<T>(cls: new () => T): Promise<T> {
	let ins = InstanceCache.get(cls);
	if (ins) return ins;

	const reflectInfos = AllReflectInfos.get(cls);
	if (!reflectInfos || reflectInfos.size < 1) {
		throw new Error(`empty reflect infos for [class ${cls.name}]`);
	}

	ins = new cls();

	for (const [k, info] of reflectInfos) {
		const opts = info.opts;
		let rawval = get(process.env, k, opts);
		if (typeof rawval === "undefined") {
			if (opts.optional) {
				continue;
			}
			throw new Error(`missing required env value, [${cls.name}.${k}]`);
		}

		if (!opts.noTrimSpace) {
			rawval = rawval.trim();
		}

		let fv: any;

		switch (info.type) {
			case Number: {
				fv = Number.parseInt(rawval);
				break;
			}
			case String: {
				fv = rawval;
				break;
			}
			case Boolean: {
				fv = TRUTHES.includes(rawval.toLocaleLowerCase());
				break;
			}
		}

		ins[k] = fv;
	}

	InstanceCache.set(cls.prototype, ins);
	return ins;
}

function sort(a: [string, Info], b: [string, Info]): number {
	const [at, bt] = [a[1].type, b[1].type];
	if (at !== bt) {
		return at.toString() < bt.toString() ? -1 : 1;
	}

	if (!a[1].opts.optional && !b[1].opts.optional) {
		return a[0] < b[0] ? -1 : 1;
	}

	if (!a[1].opts.optional) {
		return -1;
	}

	if (!b[1].opts.optional) {
		return 1;
	}
	return a[0] < b[0] ? -1 : 1;
}

export async function GenerateExampleIni<T>(cls: new () => T, fp: string) {
	const reflectInfos = AllReflectInfos.get(cls);
	if (!reflectInfos || reflectInfos.size < 1) {
		throw new Error(`empty reflect infos for [class ${cls.name}]`);
	}

	const lines = [] as string[];
	const typesSet = new Set<any>();
	for (const [k, info] of Array.from(reflectInfos.entries()).sort(sort)) {
		const opts = info.opts;
		const type = info.type;

		if (!typesSet.has(type)) {
			typesSet.add(type);
			switch (type) {
				case Number: {
					lines.push(`# ---------- numbers ----------`);
					lines.push("");
					lines.push("");
					break;
				}
				case String: {
					lines.push(`# ---------- strings ----------`);
					lines.push("");
					lines.push("");
					break;
				}
				case Boolean: {
					lines.push(`# ---------- booleans ----------`);
					lines.push("");
					lines.push("");
					break;
				}
			}
		}

		if (opts.description && opts.description === "--") {
			continue;
		}

		lines.push(`# ${opts.description || ""}`);
		if (opts.optional) {
			lines.push(`# optional`);
		}

		let line = `${k} = `;
		lines.push(line);
		lines.push("");
	}

	const content = lines.join("\n");

	return new Promise<void>((resolve, reject) => {
		fs.writeFile(fp, content, (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
}

if (ismain(import.meta)) {
	class Config {
		@prop({ description: "enable debug" })
		debug!: boolean;

		@prop()
		host!: string;

		@prop()
		port!: number;

		@prop()
		vp!: number;

		@prop({ optional: true })
		cp?: number;

		@prop({ optional: true })
		x?: boolean;
	}

	await GenerateExampleIni(Config, "./config.example.ini");
}
