import { inspect } from "util";
import { Settings, UniqueId } from "../src/index.js";
import { reflection } from "../src/index.js";
import { bind } from "../src/pkgs/reflection/bind.js";
import { containers } from "../src/pkgs/reflection/meta_register.js";
import { IsPureDataObject } from "../src/pkgs/reflection/classes.js";
const EnvRegister = new reflection.MetaRegister<
	{},
	{ optional?: boolean; type?: any },
	{}
>(Symbol("env"));

const [prop, method] = [
	EnvRegister.prop.bind(EnvRegister),
	EnvRegister.method.bind(EnvRegister),
];

@EnvRegister.cls()
class A {
	@prop({ optional: true })
	aa?: number = 12;

	@prop()
	get x(): number {
		return (this.aa || 89) + 12;
	}

	@prop({ type: reflection.containers.array(String) })
	array?: string[];

	@prop({ type: reflection.containers.set(String) })
	set?: Set<string>;

	@prop({
		type: reflection.containers.map(
			String,
			reflection.containers.map(Number, Boolean),
		),
	})
	map?: Map<string, Map<number, boolean>>;

	@method()
	yy(@EnvRegister.param() x: string) {}
}

const meta = reflection.metainfo(EnvRegister, A);
const props = meta.props();
if (props) {
	for (const [name, info] of props) {
		console.log(name, inspect(info.designtype), inspect(info.opts?.type));
	}
}

console.log(UniqueId(meta), UniqueId(props || {}));

console.log(transform("1240", Number, { radix: 16 }));

console.log(bind(containers.array(Boolean), "FTF1FFF"));

console.log(bind(containers.map(Number, Number), { "1994": 23 }));

const obj = { A: 34, Self: null };
obj.Self = obj as any;
console.log(IsPureDataObject(obj));

class Hero {
	name!: string;
	age!: number;

	static [Symbol.transform](obj: any, hint?: any): Hero {
		if (!IsPureDataObject(obj)) {
			throw new Error(``);
		}
		const ins = new Hero();
		Object.assign(ins, obj);
		return ins;
	}
}

console.log(transform({ name: "ztk", age: 89 }, Hero));
