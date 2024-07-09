import { args, sleep } from "../src/index.js";

class AAA extends args.AbsCmd<AA, Cmds> {
	run(parent?: AA, top?: Cmds): Promise<void> {
		throw new Error("Method not implemented AAA.");
	}
}

class AA extends args.AbsCmd<A, Cmds> {
	@args.flag({ alias: ["x", "xpk", "xone", "x1"] })
	x1: number = 12;

	@args.subcmd({ desc: "xxx" })
	aaa?: AAA;

	run(parent?: A, top?: Cmds): Promise<void> {
		console.log(parent, top);
		return Promise.resolve();
	}
}

class A extends args.AbsCmd<Cmds, Cmds> {
	@args.flag()
	port: number = 8080;

	@args.subcmd({ desc: "aa" })
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

@args.app({ desc: "cmds test app" })
class Cmds extends args.AbsCmd<never, never> {
	@args.subcmd({ desc: "a" })
	a?: A;

	@args.subcmd()
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

process.RegisterBeforeShutdownAction(async () => {
	console.log(">>>>>>>>>>>", "SHUTDOWN");
	await sleep(1000);
	console.log("!!!!");
});

console.log(">>>>>>>>>>>>>>>>", process.pid);
while (true) {
	await sleep(1000);
}
