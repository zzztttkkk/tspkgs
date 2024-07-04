import assert from "assert";
import { Strings } from "../src/pkgs/strings.js";

export function equal(a: any, b: any) {
	assert.strictEqual(a, b);
}

export function require_true(a: any) {
	assert.strictEqual(a, true);
}

export function require_false(a: any) {
	assert.strictEqual(a, false);
}

export class Namespace {
	#name: string;

	constructor(name: string) {
		this.#name = name;
	}

	func(f: Function): string {
		return `${this.#name}.${f.name}`;
	}
}

console.log(
	Strings.padding(
		"hello world",
		{ txt: "=", count: 10 },
		{ $SameAsLeft: true },
	),
);
