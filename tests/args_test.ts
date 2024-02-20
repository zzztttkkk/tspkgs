import { args } from "../src/index.js";

class AAA extends args.AbsCmd<AA, Cmds> {
	run(parent?: Cmds | undefined, top?: AA | undefined): Promise<void> {
		throw new Error("Method not implemented.");
	}
}

class AA extends args.AbsCmd<A, Cmds> {
	@args.cmd()
	aaa?: AAA;

	run(parent?: Cmds | undefined, top?: A | undefined): Promise<void> {
		throw new Error("Method not implemented SubOfA.");
	}
}

class A extends args.AbsCmd<Cmds, Cmds> {
	@args.flag()
	port: number = 8080;

	@args.cmd()
	aa?: AA;

	run(parent?: Cmds, top?: Cmds): Promise<void> {
		throw new Error("Method not implemented A.");
	}
}

class B extends args.AbsCmd<Cmds, Cmds> {
	@args.flag()
	num: string = "";

	run(parent?: Cmds, top?: Cmds): Promise<void> {
		throw new Error("Method not implemented B.");
	}
}

class Cmds extends args.AbsCmd<never, never> {
	@args.cmd()
	a?: A;

	@args.cmd()
	b?: B;

	@args.flag()
	dev: boolean = false;

	run(): Promise<void> {
		console.log(this);
		return Promise.resolve();
	}
}

process.argv = process.argv.concat(["-h"]);

await args.Run(Cmds);
