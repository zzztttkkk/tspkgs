import { Time } from "./time.js";
import { Duration } from "luxon";

export { Time, Duration };

export function now(): Time {
	return new Time();
}
