export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
	if (!condition) throw new Error(message);
}

export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}
