import { AllReflectInfos, type PropOptions, prop } from "./props.js";
import * as process from "process";
import { parse as load } from "./parse.js";
import { ismain, vld } from "../internal/index.js";
import { exists } from "../io/index.js";

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

	const es = await vld.validate(ins);
	if (es && es.length > 0) {
		throw new Error(
			`[EnvClass ${cls!.name} Validate Errors]: {${es.map(
				(v) => `${v.property}(${Object.keys(v.constraints || {})})`,
			)}}`,
		);
	}
	InstanceCache.set(cls.prototype, ins);
	return ins;
}

if (ismain(import.meta)) {
	class Config {
		@prop()
		@vld.IsIP()
		host!: string;

		@prop()
		@vld.IsInt()
		port!: number;
	}

	console.log(await Get(Config));
}
