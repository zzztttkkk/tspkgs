import { inspect } from "util";
import { UniqueId } from "../src/index.js";
import { reflection } from "../src/index.js";

const EnvRegister = new reflection.MetaRegister<
	{},
	{ optional?: boolean } & reflection.IBindPropOpts,
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

console.log(UniqueId(meta) === UniqueId(meta));

console.log(transform("1240", Number, { radix: 16 }));

class Hero {
	@prop()
	name!: string;

	@prop({ bindhint: { radix: 16 } })
	age!: number;
}

const ins = reflection.bind(EnvRegister, Hero, { name: "ztk", age: "120" });

console.log(ins);
