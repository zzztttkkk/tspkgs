import * as util from "util";
import { ismain } from "../internal/index.js";

export function IsClass(v: Function): boolean {
	if (typeof v !== "function") return false;
	const ins = util.inspect(v);
	if (!ins.startsWith(`[class ${v.name}`) || !ins.endsWith("]")) {
		return false;
	}
	const ts = v.toString();
	return ts.startsWith(`class ${v.name} `) && ts.endsWith("}");
}

if (ismain(import.meta)) {
	function A() {}
	class B {}
	console.log(
		IsClass(A),
		IsClass(B),
		IsClass(Number),
		IsClass(Object),
		IsClass(Date),
	);
}
