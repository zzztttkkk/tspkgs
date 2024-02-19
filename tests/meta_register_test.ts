import {
	MetaRegister,
	metainfo,
} from "../src/pkgs/reflection/meta_register.js";

const EnvRegister = new MetaRegister<{}, { optional?: boolean }, {}>(
	Symbol("env"),
);

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

	@method()
	yy(@EnvRegister.param() x: string) {}
}

const meta = metainfo(EnvRegister, A);
const props = meta.props();
if (props) {
	for (const [name, info] of props) {
		console.log(name, info);
	}
}
