import type { SupabaseServerClient } from '$lib/supabase/server';

export async function listFavorites(supabase: SupabaseServerClient, userId: string) {
	const { data, error } = await supabase
		.from('tool_favorites')
		.select('id, tool_id, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export async function isFavorite(
	supabase: SupabaseServerClient,
	userId: string,
	toolId: string
): Promise<boolean> {
	const { data, error } = await supabase
		.from('tool_favorites')
		.select('id')
		.eq('user_id', userId)
		.eq('tool_id', toolId)
		.maybeSingle();

	if (error) throw error;
	return Boolean(data);
}

export async function addFavorite(supabase: SupabaseServerClient, userId: string, toolId: string) {
	const { error } = await supabase
		.from('tool_favorites')
		.upsert(
			{ user_id: userId, tool_id: toolId },
			{ onConflict: 'user_id,tool_id', ignoreDuplicates: true }
		);
	if (error) throw error;
}

export async function removeFavorite(
	supabase: SupabaseServerClient,
	userId: string,
	toolId: string
) {
	const { error } = await supabase
		.from('tool_favorites')
		.delete()
		.eq('user_id', userId)
		.eq('tool_id', toolId);
	if (error) throw error;
}
