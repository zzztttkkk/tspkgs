import assert from "assert";

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
