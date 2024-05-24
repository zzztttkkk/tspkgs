import { vld } from "../src/index.js";

class User {
	@vld.prop()
	public name: string = "";

	@vld.int({ min: 0, max: 100000 })
	public age: number = -8;

	@vld.prop()
	public get adult(): boolean {
		return this.age >= 18;
	}
}

const err = vld.validate(new User());
console.log(err);
