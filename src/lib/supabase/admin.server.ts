import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { getPrivateEnv } from '$server/env';
import type { Database } from './database.types';

/** Service-role client — server-only. Returns null if key is not configured. */
export function createSupabaseAdminClient() {
	const key = getPrivateEnv().SUPABASE_SERVICE_ROLE_KEY;
	if (!key) return null;
	return createClient<Database>(PUBLIC_SUPABASE_URL, key, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}
