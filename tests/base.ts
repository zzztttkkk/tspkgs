import assert from "assert";
import "../src/index.js";
import { inspect } from "util";
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

interface IPointTransformHits {
	isjsonstring?: boolean;
}

class Point {
	#x: number;
	#y: number;

	constructor(x: number, y: number) {
		this.#x = x;
		this.#y = y;
	}

	toJSON() {
		return { x: this.#x, y: this.#y };
	}

	static [Symbol.transform](v: any, hint?: IPointTransformHits): Point {
		if (v instanceof Point) {
			return new Point(v.#x, v.#y);
		}

		switch (typeof v) {
			case "string": {
				if (hint?.isjsonstring) {
					return transform(JSON.parse(v), Point);
				}
				if (v.includes(",")) {
					const [a, b] = v.split(",");
					return new Point(transform(a, Number), transform(b, Number));
				}
				throw new Error(`Cannot transform ${v} to Point`);
			}
			case "object": {
				if (Array.isArray(v) && v.length == 2) {
					return new Point(transform(v[0], Number), transform(v[1], Number));
				}

				if (v.x != null && v.y != null) {
					return new Point(transform(v.x, Number), transform(v.y, Number));
				}
			}
		}
		throw new Error(`Cannot transform ${v} to Point`);
	}

	[inspect.custom]() {
		return `Point{${this.#x}, ${this.#y}}`;
	}

	distance(v: Point): number {
		return Math.sqrt(Math.pow(this.#x - v.#x, 2) + Math.pow(this.#y - v.#y, 2));
	}
}

console.log(transform(" 23, 45 ", Point));
