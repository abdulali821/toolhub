import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { clearHistory, listHistory } from '$lib/features/history/api.server';
import { getTool } from '$tools';

export const load: PageServerLoad = async ({ locals, parent }) => {
	await parent();
	const user = locals.user!;
	const rows = await listHistory(locals.supabase, user.id);

	const history = rows.map((row) => {
		const tool = getTool(row.tool_id);
		return {
			id: row.id,
			toolId: row.tool_id,
			usedAt: row.used_at,
			name: tool?.metadata.name ?? row.tool_id,
			description: tool?.metadata.description ?? 'Tool may have been removed from the catalog.'
		};
	});

	return { history };
};

export const actions: Actions = {
	clear: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Sign in required' });
		await clearHistory(locals.supabase, locals.user.id);
		return { success: true };
	}
};
