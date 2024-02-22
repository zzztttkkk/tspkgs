import * as process from "process";
import fs from "fs/promises";
import {
	MetaRegister,
	metainfo,
	type PropInfo,
} from "../reflection/meta_register.js";
import { inspect } from "util";
import "../transform/index.js";

const InstanceCache = new Map<any, any>();

function get(
	obj: NodeJS.Dict<string>,
	k: string,
	opts?: PropOptions,
): string | undefined {
	let keys = [k] as Array<string | undefined>;
	if (opts?.aliases) {
		keys = keys.concat(opts.aliases);
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
export interface PropOptions {
	aliases?: string[];
	optional?: boolean;
	keepspace?: boolean;
	description?: string;
	type?: Function;
}

const register = new MetaRegister<unknown, PropOptions, unknown>(
	Symbol("pkgs:env"),
);

export function prop(opts?: PropOptions) {
	return register.prop(opts);
}

export async function Get<T>(cls: new () => T): Promise<T> {
	let ins = InstanceCache.get(cls);
	if (ins) return ins;

	const meta = metainfo(register, cls);
	const props = meta.props();
	if (!props || props.size < 1) {
		throw new Error(`pkgs.env: empty reflect infos for ${inspect(cls)}`);
	}

	ins = new cls();

	for (const [k, info] of props) {
		const opts = info.opts;
		let rawval = get(process.env, k, opts);
		if (typeof rawval === "undefined") {
			if (opts?.optional) {
				continue;
			}
			throw new Error(`missing required env value, [${cls.name}.${k}]`);
		}

		if (!opts?.keepspace) {
			rawval = rawval.trim();
		}

		const type = opts?.type || info.designtype;
		ins[k] = transform(rawval, type);
	}

	InstanceCache.set(cls.prototype, ins);
	return ins;
}

function sort(
	a: [string, PropInfo<PropOptions>],
	b: [string, PropInfo<PropOptions>],
): number {
	const [at, bt] = [
		a[1].opts?.type || a[1].designtype,
		b[1].opts?.type || b[1].designtype,
	];
	if (at !== bt) {
		return at.toString() < bt.toString() ? -1 : 1;
	}

	if (!a[1].opts?.optional && !b[1].opts?.optional) {
		return a[0] < b[0] ? -1 : 1;
	}

	if (!a[1].opts?.optional) {
		return -1;
	}

	if (!b[1].opts?.optional) {
		return 1;
	}
	return a[0] < b[0] ? -1 : 1;
}

export async function GenerateExampleIni<T>(cls: new () => T, fp: string) {
	const meta = metainfo(register, cls);
	const props = meta.props();
	if (!props || props.size < 1) {
		throw new Error(`pkgs.env: empty reflect infos for ${inspect(cls)}`);
	}

	const lines = [] as string[];
	const typesSet = new Set<any>();
	for (const [k, info] of Array.from(props.entries()).sort(sort)) {
		const opts = info.opts;
		const type = info.opts?.type || info.designtype;

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

		if (opts && opts.description && opts.description === "--") {
			continue;
		}

		if (opts && opts.description) {
			lines.push(`# ${opts.description || ""}`);
		}

		if (opts?.optional) {
			lines.push(`# optional`);
		}

		let line = `${k} = `;
		lines.push(line);
		lines.push("");
	}

	const content = lines.join("\n");
	await fs.writeFile(fp, content);
}
