import * as crypto from "crypto";

class RandByWeightsGenerator<T extends { weight: number }> {
	#total: number;
	#randnumfnc: (max: number) => number;
	constructor(
		private _items: T[],
		opts?: { crypto?: boolean },
	) {
		this._items = _items;
		this.#total = this._items.reduce((acc, item) => acc + item.weight, 0);
		if (opts?.crypto) {
			this.#randnumfnc = crypto.randomInt.bind(crypto);
		} else {
			this.#randnumfnc = (max: number) => Math.floor(Math.random() * max);
		}
	}

	generate(): T {
		const random = this.#randnumfnc(this.#total);
		let sum = 0;
		for (const item of this._items) {
			sum += item.weight;
			if (sum >= random) {
				return item;
			}
		}
		throw new Error("Invalid weights");
	}
}

export class Rands {}
