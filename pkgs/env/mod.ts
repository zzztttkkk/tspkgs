import { load } from "std/dotenv/mod.ts";
import { Reflect } from "reflect/mod.ts";
import { RwLock } from "../sync/mod.ts";
import { assert } from "std/assert/assert.ts";
import { vld } from "../internal/mod.ts";

Object.entries(await load()).forEach(([k, v]) => {
	Deno.env.set(k, v);
});

export interface PropOptions {
	optional?: boolean;
	default?: any;
	aliases?: string[];
	caseSensitive?: boolean;

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
			throw new Error(`bad design:type for "${cls.name}.${key}"`);
		}
		const infos = reflectInfos.get(cls) || new Map();
		infos.set(key, { designType, opts: opts || {} });
		reflectInfos.set(cls, infos);
	};
}

function getRawFromEnv(k: string, info: PropInfo): string | undefined {
	let names = [k, ...(info.opts.aliases || [])] as string[];
	let src: { [k: string]: string };
	if (!info.opts.caseSensitive) {
		names = names.map((v) => v.toLowerCase());
		const lowercaseEnvobj = {} as { [k: string]: string };

		Object.entries(Deno.env.toObject()).forEach(([k, v]) => {
			lowercaseEnvobj[k.toLowerCase()] = v;
		});
		src = lowercaseEnvobj;
	} else {
		src = Deno.env.toObject();
	}

	for (const name of names) {
		const txt = src[name];
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
	}
}

const insCache = new Map<any, any>();
const rwLock = new RwLock();

async function getIns<T>(cls?: { new (): T }): Promise<T> {
	let ins = insCache.get(cls);
	if (ins != null) {
		return ins as T;
	}

	const infos = reflectInfos.get(cls);
	if (!infos) {
		throw new Error(`${cls} is not registered`);
	}

	ins = new cls!();

	for (const [k, info] of infos) {
		try {
			ins[k] = await getVal(k, info);
		} catch (e) {
			throw new Error(`[EnvClass ${cls!.name}], ${e instanceof Error ? e.message : e.toString()}`);
		}
	}

	const errors = await vld.validate(ins, { enableDebugMessages: true });
	if (errors && errors.length > 0) {
		throw new Error(
			`[EnvClass ${cls!.name} Validate Errors]: {${
				errors.map((v) => `${v.property}(${Object.keys(v.constraints || {})})`)
			}}`,
		);
	}
	insCache.set(cls, ins);
	return ins;
}

export async function Get<T>(cls: { new (): T }): Promise<T> {
	return await rwLock.withinw(getIns, cls);
}

if (import.meta.main) {
	class Config {
		@prop()
		@vld.IsIP()
		host!: string;

		@prop({ aliases: ["ext_cfg"] })
		@vld.ExistsFilePath()
		extcfg!: string;

		@prop()
		@vld.Max(100)
		@vld.Min(20)
		port!: number;

		@prop()
		@vld.Match(/^[a-h]{3}$/g)
		name!: string;
	}

	const ps = [] as Promise<Config>[];
	for (let i = 0; i < 100; i++) {
		ps.push(Get(Config));
	}

	const inses = await Promise.all(ps);
	for (const obj of inses) {
		assert(obj === inses[0]);
	}

	console.log(inses[0]);
}
