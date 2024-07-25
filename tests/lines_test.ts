import * as fs from "fs/promises";
import { asyncenumerate, io } from "../src/index.js";

const cf = await fs.open(import.meta.filename, "r");

for await (const [lineno, line] of asyncenumerate(
	io.lines(cf.createReadStream()),
)) {
	console.log(lineno, " ", line);
}
