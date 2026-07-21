import type { Logger } from '$server/logger';
import type { Session, User } from '@supabase/supabase-js';
import type { SupabaseServerClient } from '$lib/supabase/server';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}

		interface Locals {
			requestId: string;
			log: Logger;
			supabase: SupabaseServerClient;
			user: User | null;
			session: Session | null;
		}
	}
}

export {};
