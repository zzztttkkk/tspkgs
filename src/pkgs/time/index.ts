import { FakeDate } from "./FakeDate.js";
import { Time } from "./time.js";
import { Duration } from "luxon";

export { Time, Duration };

export function now(): Time {
	return new Time();
}

export async function hook(v: string) {
	await FakeDate.hook(v);
}
