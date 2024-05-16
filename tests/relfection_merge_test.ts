import { reflection } from "../src/index.js";

interface PropOptions extends reflection.IMergePropOpts {}

const register = new reflection.MetaRegister<unknown, PropOptions, unknown>(
	Symbol("MergeTest"),
);

class A {
	@register.prop()
	str: string = "";

	@register.prop()
	num: number = 0;

	@register.prop()
	bool: boolean = false;
}

const a1 = reflection.bind(register, A, { str: "a1" });

console.log(a1);

console.log(
	reflection.merge(
		register,
		a1,
		[{ num: 45 }, { bool: true }, { str: "xxx" }],
		{
			overwrite: (dv, sv, cls, k, p) => {
				if (cls === A && k === "num" && dv < 10) {
					return true;
				}
				return false;
			},
		},
	),
);
