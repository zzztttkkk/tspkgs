import { ismain } from "../internal/index.js";
import { MetaRegister } from "../reflection/meta_register.js";

interface IFlagOpts {
	optional?: boolean;
}

interface ICmdOpts {}

interface IPropOpts {
	isFlog: boolean;
	opts?: ICmdOpts | IFlagOpts;
}

const register = new MetaRegister<unknown, IPropOpts, unknown>(
	Symbol("pkgs:args"),
);

export function flag(opts?: IFlagOpts) {
	return register.prop({ isFlog: true, opts });
}

export function cmd(opts?: ICmdOpts) {
	return register.prop({ isFlog: false, opts });
}

const [NODE_PATH, SCRIPT_PATH, ...ARGS] = process.argv;

export function Parse<T>(cls: new () => T): T {
	return _parse(cls, true);
}

function _parse<T>(cls: new () => T, isTop: boolean): T {
	const obj = new cls();
	return obj;
}

if (ismain(import.meta)) {
	class A {
		@flag()
		port: number = 8080;
	}

	class B {
		@flag()
		num: string = "";
	}

	class Cmds {}

	console.log(Parse(A));
}
