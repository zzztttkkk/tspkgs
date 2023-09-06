import { load } from "std/dotenv/mod.ts";
import { validate } from "vld/mod.ts";
import { Reflect } from "reflect/mod.ts";
import { BaseEnvValue, FilePath } from "./types.ts";

await load();

export interface PropOptions {
	optional?: boolean;
	default?: any;
	aliases?: string[];

	// number
	allowFloat?: boolean;

	// string
	noTrim?: boolean;

	// FilePath; DirPath
	allowNotExists?: boolean;

	// Time
	fmt?: string;
}

interface PropInfo {
	opts: PropOptions;
	designType: any;
}

const reflectInfos = new Map<any, Map<string, PropInfo>>();

export function prop(opts?: PropOptions): PropertyDecorator {
	return function (target, key) {
		if (typeof key !== "string") return;
		const cls = target.constructor;
		const designType = Reflect.getMetadata("design:type", target, key);
		if (![String, Number, Boolean].includes(designType)) {
			if (!designType || !(designType.prototype instanceof BaseEnvValue)) {
				throw new Error(`bad design:type for "${cls.name}.${key}"`);
			}
		}
		const infos = reflectInfos.get(cls) || new Map();
		infos.set(key, { designType, opts: opts || {} });
		reflectInfos.set(cls, infos);
	};
}

function getRawFromEnv(k: string, info: PropInfo): string | undefined {
	const names = [k, ...(info.opts.aliases || [])] as string[];
	for (const name of names) {
		const txt = Deno.env.get(name);
		if (txt != null) {
			return txt;
		}
	}
	return undefined;
}

async function getVal(k: string, info: PropInfo): Promise<any> {
	let raw = getRawFromEnv(k, info);
	if (raw == null) {
		if (info.opts.default != null) {
			if (typeof info.opts.default === "function") {
				return await info.opts.default();
			}
			return structuredClone(info.opts.default);
		}

		if (!info.opts.optional) {
			throw new Error(`missing required field: ${k}`);
		}
		return undefined;
	}

	if (!info.opts.noTrim) {
		raw = raw.trim();
	}

	switch (info.designType) {
		case Number: {
			if (info.opts.allowFloat) {
				return Number.parseFloat(raw);
			}
			return Number.parseInt(raw);
		}
		case String: {
			return raw;
		}
		case Boolean: {
			return ["true", "t", "T", "True", "TRUE", "ok", "yes", "1"].includes(raw);
		}
		default: {
			return BaseEnvValue.init(info.designType, raw, info.opts);
		}
	}
}

const insCache = new Map<any, any>();

export async function Instance<T>(cls: { new (...args: any[]): T }): Promise<T> {
	let ins = insCache.get(cls);
	if (ins != null) return ins as T;

	const infos = reflectInfos.get(cls);
	if (!infos) {
		throw new Error(`${cls} is not registered`);
	}

	ins = new cls();

	for (const [k, info] of infos) {
		try {
			ins[k] = await getVal(k, info);
		} catch (e) {
			throw new Error(`[EnvClass ${cls.name}], ${e instanceof Error ? e.message : e.toString()}`);
		}
	}

	await validate(ins, { enableDebugMessages: true });
	insCache.set(cls, ins);
	return ins;
}

if (import.meta.main) {
	class Config {
		@prop()
		host!: string;

		@prop()
		x!: FilePath;
	}

	console.log(await Instance(Config));
}
