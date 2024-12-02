interface PaddingOpts {
	txt: string;
	count?: number;
}

export class Strings {
	public static padding(
		v: string,
		left?: PaddingOpts,
		right?: PaddingOpts | { $SameAsLeft: boolean },
	) {
		let lv = "";
		if (left) {
			lv = left.txt.repeat(left.count || 1);
		}
		let rv = "";
		if (right) {
			if ("$SameAsLeft" in right) {
				if (!left) throw new Error(`left is undefined`);
				rv = lv;
			} else {
				rv = right.txt.repeat(right.count || 1);
			}
		}
		return [lv, v, rv].join("");
	}

	public static split(v: string, ...seps: string[]): string[] {
		if (seps.length === 0) return [v];
		if (seps.length === 1) return v.split(seps[0]);

		let tmp: string | string[] = v;
		for (const sep of seps) {
			if (Array.isArray(tmp)) {
				tmp = tmp.flatMap((v) => v.split(sep));
			} else {
				tmp = tmp.split(sep);
			}
		}
		return tmp as string[];
	}
}
