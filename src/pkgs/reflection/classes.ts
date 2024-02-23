import * as util from "util";

export function IsClass(v: Function): boolean {
	if (typeof v !== "function") return false;
	const ins = util.inspect(v);
	if (!ins.startsWith(`[class ${v.name}`) || !ins.endsWith("]")) {
		return false;
	}
	const ts = v.toString();
	return ts.startsWith(`class ${v.name} `) && ts.endsWith("}");
}

export function IsSubClassOf(sub: Function, base: Function): boolean {
	return sub.prototype instanceof base;
}

export function IsPureDataObject(v: any): boolean {
	switch (typeof v) {
		case "object": {
			if (v == null) return false;
			return Object.getPrototypeOf(v).constructor === Object;
		}
		default: {
			return false;
		}
	}
}
