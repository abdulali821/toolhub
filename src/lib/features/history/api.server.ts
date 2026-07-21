import type { SupabaseServerClient } from '$lib/supabase/server';
import type { Json } from '$lib/supabase/database.types';

export async function listHistory(supabase: SupabaseServerClient, userId: string, limit = 50) {
	const { data, error } = await supabase
		.from('tool_history')
		.select('id, tool_id, used_at, meta')
		.eq('user_id', userId)
		.order('used_at', { ascending: false })
		.limit(limit);

	if (error) throw error;
	return data ?? [];
}

const HISTORY_THROTTLE_MS = 30 * 60 * 1000;

export async function recordHistory(
	supabase: SupabaseServerClient,
	userId: string,
	toolId: string,
	meta: Json = {}
) {
	const { data: latest, error: selectError } = await supabase
		.from('tool_history')
		.select('id, used_at')
		.eq('user_id', userId)
		.eq('tool_id', toolId)
		.order('used_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (selectError) throw selectError;

	const now = new Date();
	if (latest?.used_at) {
		const lastUsed = new Date(latest.used_at).getTime();
		if (now.getTime() - lastUsed < HISTORY_THROTTLE_MS) {
			const { error: updateError } = await supabase
				.from('tool_history')
				.update({ used_at: now.toISOString(), meta })
				.eq('id', latest.id);
			if (updateError) throw updateError;
			return;
		}
	}

	const { error } = await supabase.from('tool_history').insert({
		user_id: userId,
		tool_id: toolId,
		meta
	});
	if (error) throw error;
}

export async function clearHistory(supabase: SupabaseServerClient, userId: string) {
	const { error } = await supabase.from('tool_history').delete().eq('user_id', userId);
	if (error) throw error;
}
