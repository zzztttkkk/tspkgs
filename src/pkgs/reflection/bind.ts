import { inspect } from "util";
import { ArrayType, MapType, SetType, TypeValue } from "./meta_register.js";

export function bind(typev: TypeValue, obj: any, hint?: any): any {
	if (typeof typev === "function") return transform(obj, typev as any, hint);

	if (typev instanceof ArrayType) {
		if (!obj || typeof obj[Symbol.iterator] !== "function") {
			throw new Error(
				`can not bind to array from a non-iterable object, ${inspect(obj)}`,
			);
		}

		const ary = [] as any[];
		for (const ele of obj) {
			ary.push(bind(typev.eletype, ele, typev.bindhint));
		}
		return ary;
	}

	if (typev instanceof SetType) {
		if (!obj || typeof obj[Symbol.iterator] !== "function") {
			throw new Error(
				`can not bind to set from a non-iterable object, ${inspect(obj)}`,
			);
		}

		const ary = new Set<any>();
		for (const ele of obj) {
			ary.add(bind(typev.eletype, ele, typev.bindhint));
		}
		return ary;
	}

	if (!(typev instanceof MapType)) {
		throw new Error(`bad type value: ${typev}`);
	}

	const map = new Map<any, any>();

	function add(k: any, v: any) {
		map.set(
			bind((typev as MapType).keytype, k, (typev as MapType).keybindhint),
			bind((typev as MapType).eletype, v, (typev as MapType).bindhint),
		);
	}

	if (obj instanceof Map) {
		for (const [k, v] of obj) {
			add(k, v);
		}
		return map;
	}

	if (obj && typeof obj[Symbol.iterator] === "function") {
		for (const ele of obj) {
			if (Array.isArray(ele) && ele.length === 2) {
				add(ele[0], ele[1]);
			} else {
				throw new Error(
					`can not bind to map, because the ${inspect(
						obj,
					)}'s ele is not array or length !== 2`,
				);
			}
		}
		return map;
	}
	Object.entries(obj).forEach(([k, v]) => add(k, v));
	return map;
}
