import * as v from 'valibot';

/** Flatten Valibot issues into a field → message map for forms. */
export function flattenIssues(issues: v.BaseIssue<unknown>[]): Record<string, string> {
	const fields: Record<string, string> = {};

	for (const issue of issues) {
		const key = issue.path?.map((p) => String(p.key)).join('.') || '_form';
		if (!fields[key]) fields[key] = issue.message;
	}

	return fields;
}
