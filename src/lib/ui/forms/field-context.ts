import { getContext, setContext } from 'svelte';

const KEY = Symbol('toolhub.field');

export type FieldContext = {
	getDescribedBy: () => string | undefined;
};

export function setFieldContext(ctx: FieldContext): void {
	setContext(KEY, ctx);
}

export function getFieldContext(): FieldContext | undefined {
	return getContext<FieldContext | undefined>(KEY);
}

export function getFieldDescribedBy(): string | undefined {
	return getFieldContext()?.getDescribedBy();
}
