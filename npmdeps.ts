// @deno-types="npm:@types/luxon"
import * as luxon from "npm:luxon";
import * as typegoose from "npm:@typegoose/typegoose";
import * as mongoose from "npm:mongoose";
export { luxon, mongoose, typegoose };

if (import.meta.main) {
	const conn = await mongoose.connect("mongodb://ztk:123456@127.0.0.1:37000/tspkgs");
	console.log(conn);
}
