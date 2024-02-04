import * as util from "util";
import { ismain } from "../internal/index.js";

export function IsClass(v: Function): boolean {
	if (typeof v !== "function") return false;
	if (util.inspect(v) !== `[class ${v.name}]`) return false;
	const txt = v.toString();
	return txt.startsWith(`class ${v.name} {`) && txt.endsWith("}");
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
