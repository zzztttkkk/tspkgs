export class ValidationError extends Error {
	constructor(cls: Function, k: string, val: any) {
		super("");
	}
}

export class MissingRequiredError extends ValidationError {}

export class BadValueError extends ValidationError {}

export class IntOutOfRangeError extends BadValueError {
	constructor(
		cls: Function,
		k: string,
		val: any,
		min: number | undefined,
		max: number | undefined,
	) {
		super(cls, k, val);
	}
}
