import { inspect } from "util";
import {
	MetaRegister,
	PropInfo,
	metainfo,
} from "../reflection/meta_register.js";
import { transform } from "../transform/index.js";
import { __ } from "../internal/index.js";

interface IBaseOpts {
	alias?: string[];
	type?: any;
	desc?: string;
}

interface IFlagOpts extends IBaseOpts {}

interface ICmdOpts extends IBaseOpts {}

interface IAppOpts {
	name?: string;
	desc?: string;
}

interface IPropOpts {
	isFlog: boolean;
	opts?: ICmdOpts | IFlagOpts;
}

const register = new MetaRegister<IAppOpts, IPropOpts, unknown>(
	Symbol("pkgs:args"),
);

export function app(opts?: IAppOpts) {
	return register.cls(opts);
}

export function flag(opts?: IFlagOpts) {
	return register.prop({ isFlog: true, opts });
}

export function subcmd(opts?: ICmdOpts) {
	return register.prop({ isFlog: false, opts });
}

const [NODE_PATH, SCRIPT_PATH, ..._] = process.argv;

export { NODE_PATH, SCRIPT_PATH };

function unqoute(v: string): string {
	if (!v) return "";

	function qed(t: string): boolean {
		return v.startsWith(t) && v.endsWith(t);
	}

	for (const t of ['"', "'", "`"]) {
		if (qed(t)) {
			return v.slice(1, v.length - 1);
		}
	}
	return v;
}

const CmdRegxp = /^[a-z]([a-z0-9_]*)$/g;

function iscmd(v: string): boolean {
	return Array.from(v.matchAll(CmdRegxp)).length > 0;
}

function strequal(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}

function _parse<T>(cls: new () => T, args: string[]): T {
	const obj = new cls();
	if (args.length < 1) return obj;

	const meta = metainfo(register, cls);
	const props = meta.props();

	if (!props || props.size < 1) {
		for (const av of args) {
			if (__.Any(["--help", "-h"], (v) => av.toLowerCase() === v)) {
				(obj as any).NeedHelp = true;
			}
		}
		return obj;
	}

	const HasSubCmd = __.Any(
		props!.values(),
		(v) => !!(v.opts && !v.opts.isFlog),
	);

	function getprop(name: string) {
		for (const [k, v] of props!) {
			if (strequal(k, name)) return { k, v };

			if (v.opts && v.opts.opts && v.opts.opts.alias) {
				for (const n of v.opts.opts.alias) {
					if (strequal(n, name)) {
						return { k, v };
					}
				}
			}
		}
		return undefined;
	}

	const changedNames = new Set<string>();

	let i = 0;
	for (; i < args.length; i++) {
		const av = args[i];
		if (iscmd(av)) {
			const prop = getprop(av);
			if (!prop) {
				throw new Error(
					`pkgs.args: unsupported command name: \`${av}\` on \`${inspect(
						cls,
					)}\``,
				);
			}

			const type = prop.v.opts?.opts?.type || prop.v.designtype;
			(obj as any)[prop.k] = _parse(type, args.slice(i + 1));
			break;
		}

		let name: string;
		if (av.startsWith("--")) {
			name = av.slice(2);
		} else if (av.startsWith("-")) {
			name = av.slice(1);
		} else {
			throw new Error(`pkgs.args: bad argv, \`${av}\``);
		}

		let value: string | undefined;

		const parts = name.split("=");

		if (parts.length > 1) {
			name = parts[0];
			value = parts.slice(1).join("=");
		} else if (!HasSubCmd) {
			const next = args[i + 1];
			if (next && !next.startsWith("-")) {
				value = next;
				i++;
			}
		}
		if (name.startsWith("-")) continue;

		value = value ? unqoute(value) : value;

		const prop = getprop(name);
		if (!prop) {
			if (["help", "h"].includes(name.toLowerCase())) {
				(obj as any).NeedHelp = true;
				continue;
			}
			continue;
		}

		const type = prop.v.opts?.opts?.type || prop.v.designtype;

		let tv: any;
		if (type === Boolean) {
			if (!value) {
				tv = true;
			} else {
				tv = transform(value, Boolean);
			}
		} else {
			if (typeof value === "undefined") {
				throw new Error(`pkgs.args: missing value after \`${av}\``);
			}
			tv = transform(value, type);
		}
		(obj as any)[name] = tv;
		changedNames.add(name);
	}

	return obj;
}

export abstract class AbsCmd<Parent, Top> {
	private readonly NeedHelp: boolean = false;

	abstract run(parent?: Parent, top?: Top): Promise<void>;
}

function GetNames(name: string, opts: PropInfo<IPropOpts>): string[] {
	let names = [name] as string[];
	if (opts.opts?.opts?.alias) {
		for (const av of opts.opts?.opts?.alias) {
			if (names.find((e) => strequal(av, e))) {
				continue;
			}
			names.push(av);
		}
	}

	names = names.sort((a, b) => {
		if (a.length > b.length) {
			return -1;
		}
		if (a.length < b.length) {
			return 1;
		}
		return a > b ? 1 : 1;
	});
	return names;
}

function printHelp(
	cls: any,
	stacks: AbsCmd<unknown, unknown>[],
	name: string | undefined,
) {
	const meta = metainfo(register, cls);
	const clsinfo = meta.cls();

	const names: string[] = stacks.map((v) => {
		const _cls = Object.getPrototypeOf(v).constructor;
		const _clsInfo = metainfo(register, _cls).cls();
		return _clsInfo?.name || _cls.name;
	});
	names.push(clsinfo?.name || cls.name);

	let desc: string | undefined = "";
	const parentObj = stacks[stacks.length - 1];
	if (parentObj && name) {
		const prop = metainfo(
			register,
			Object.getPrototypeOf(parentObj).constructor,
		).prop(name);
		desc = prop?.opts?.opts?.desc;
	}
	if (!desc) {
		desc = clsinfo?.desc;
	}

	if (desc) {
		console.log(desc);
	}
	console.log("");

	const props = meta.props();
	if (props && props.size > 0) {
		const items = Array.from(props.entries());
		const flags = items.filter((v) => v[1].opts && v[1].opts.isFlog);

		if (flags.length > 0) {
			console.log("Options:");
			for (const [name, opts] of flags) {
				const names = GetNames(name, opts).map((e) => {
					if (e.length > 1) {
						return `--${e}`;
					}
					return `-${e}`;
				});

				console.log(
					`  ${names.join("; ")}  [${
						opts.designtype.name || inspect(opts.designtype)
					}]  ${opts.opts?.opts?.desc || ""}`,
				);
			}
		}

		const cmds = items.filter((v) => v[1].opts && !v[1].opts.isFlog);

		if (cmds.length > 0) {
			console.log("Commands:");
			for (const [name, opts] of cmds) {
				const names = GetNames(name, opts);

				desc = opts.opts?.opts?.desc;
				if (!desc) {
					const _cls = opts.opts?.opts?.type || opts.designtype;
					const _clsInfo = metainfo(register, _cls).cls();
					desc = _clsInfo?.desc;
				}
				console.log(`  ${names.join("; ")}  ${desc || ""}`);
			}
		}
	}
}

async function _exec(obj: AbsCmd<any, any>) {
	const topObj = obj;

	let cmdObj = obj;
	const stacks: AbsCmd<unknown, unknown>[] = [];
	let lastKey: string | undefined;

	while (true) {
		const cls = Object.getPrototypeOf(cmdObj).constructor;
		const props = metainfo(register, cls).props();
		if (!props) {
			break;
		}

		let found = false;
		for (const k of Array.from(props.entries())
			.filter((v) => v[1].opts && !v[1].opts.isFlog)
			.map((v) => v[0])) {
			const tmp = (cmdObj as any)[k];
			if (tmp) {
				lastKey = k;
				stacks.push(cmdObj);
				cmdObj = tmp;
				found = true;
				break;
			}
		}

		if (!found) break;
	}
	const parentObj = stacks[stacks.length - 1];

	if ((cmdObj as any).NeedHelp) {
		printHelp(Object.getPrototypeOf(cmdObj).constructor, stacks, lastKey);
		return;
	}
	return cmdObj.run(parentObj, topObj);
}

export function Parse<T extends AbsCmd<unknown, unknown>>(cls: new () => T): T {
	return _parse(cls, process.argv.slice(2));
}

export function Run<T extends AbsCmd<unknown, unknown>>(
	cls: new () => T,
): Promise<void> {
	return _exec(Parse(cls));
}
