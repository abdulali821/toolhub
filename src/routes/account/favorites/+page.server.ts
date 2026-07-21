import type { PageServerLoad } from './$types';
import { listFavorites } from '$lib/features/favorites/api.server';
import { getTool } from '$tools';

export const load: PageServerLoad = async ({ locals, parent }) => {
	await parent();
	const user = locals.user!;
	const rows = await listFavorites(locals.supabase, user.id);

	const favorites = rows.map((row) => {
		const tool = getTool(row.tool_id);
		return {
			id: row.id,
			toolId: row.tool_id,
			createdAt: row.created_at,
			name: tool?.metadata.name ?? row.tool_id,
			description: tool?.metadata.description ?? 'Tool may have been removed from the catalog.'
		};
	});

	return { favorites };
};
