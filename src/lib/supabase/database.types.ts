export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					display_name: string | null;
					id: string;
					settings: Json;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					id: string;
					settings?: Json;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string | null;
					id?: string;
					settings?: Json;
					updated_at?: string;
				};
				Relationships: [];
			};
			tool_favorites: {
				Row: {
					created_at: string;
					id: string;
					tool_id: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					tool_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					tool_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'tool_favorites_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			tool_history: {
				Row: {
					id: string;
					meta: Json;
					tool_id: string;
					used_at: string;
					user_id: string;
				};
				Insert: {
					id?: string;
					meta?: Json;
					tool_id: string;
					used_at?: string;
					user_id: string;
				};
				Update: {
					id?: string;
					meta?: Json;
					tool_id?: string;
					used_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'tool_history_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			uploads: {
				Row: {
					bucket: string;
					bytes: number | null;
					created_at: string;
					id: string;
					mime: string | null;
					path: string;
					status: string;
					user_id: string;
				};
				Insert: {
					bucket: string;
					bytes?: number | null;
					created_at?: string;
					id?: string;
					mime?: string | null;
					path: string;
					status?: string;
					user_id: string;
				};
				Update: {
					bucket?: string;
					bytes?: number | null;
					created_at?: string;
					id?: string;
					mime?: string | null;
					path?: string;
					status?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'uploads_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};

export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
