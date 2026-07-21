import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	sql: v.pipe(v.string(), v.minLength(1, 'Paste SQL to format')),
	uppercaseKeywords: v.optional(v.boolean(), true)
});

export type SqlFormatterInput = v.InferOutput<typeof inputSchema>;
export type SqlFormatterOutput = { formatted: string };

const CLAUSE_KEYWORDS = [
	'UNION ALL',
	'INNER JOIN',
	'LEFT JOIN',
	'RIGHT JOIN',
	'FULL JOIN',
	'CROSS JOIN',
	'GROUP BY',
	'ORDER BY',
	'INSERT INTO',
	'DELETE FROM',
	'SELECT',
	'FROM',
	'WHERE',
	'JOIN',
	'HAVING',
	'LIMIT',
	'OFFSET',
	'VALUES',
	'SET',
	'INSERT',
	'UPDATE',
	'DELETE',
	'ON',
	'UNION'
].sort((a, b) => b.length - a.length);

export function formatSql(sql: string, uppercaseKeywords = true): string {
	let normalized = sql.replace(/\s+/g, ' ').trim();
	if (!normalized) return '';

	for (const keyword of CLAUSE_KEYWORDS) {
		const pattern = keyword.replace(/\s+/g, '\\s+');
		const re = new RegExp(`\\s*\\b(${pattern})\\b`, 'gi');
		normalized = normalized.replace(re, (_, matched: string) => {
			const text = uppercaseKeywords ? matched.toUpperCase() : matched;
			return `\n${text}`;
		});
	}

	return normalized
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.join('\n');
}

export function run(input: SqlFormatterInput): SqlFormatterOutput {
	return {
		formatted: formatSql(input.sql, input.uppercaseKeywords ?? true)
	};
}

const DEFAULT_SQL = 'SELECT id, name FROM users WHERE active = true ORDER BY name LIMIT 10';

export const sqlFormatter: ToolDefinition<SqlFormatterInput, SqlFormatterOutput> = {
	id: 'sql-formatter',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['sql', 'format', 'query', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['sql', 'uppercaseKeywords']
	},
	presets: [
		{
			id: 'select',
			label: 'SELECT query',
			params: { sql: DEFAULT_SQL, uppercaseKeywords: 'true' }
		},
		{
			id: 'insert',
			label: 'INSERT',
			params: {
				sql: 'INSERT INTO users (name, email) VALUES ("Ada", "ada@example.com")',
				uppercaseKeywords: 'true'
			}
		},
		{
			id: 'update',
			label: 'UPDATE',
			params: {
				sql: 'UPDATE users SET active = false WHERE id = 1',
				uppercaseKeywords: 'true'
			}
		}
	],
	workflow: {
		next: ['regex-tester', 'json-formatter']
	},
	metadata: {
		name: 'SQL Formatter',
		title: 'SQL Formatter — Pretty-print SQL queries online',
		description:
			'Paste SQL to format queries with line breaks before major clauses. Free online SQL pretty-printer.',
		keywords: ['sql formatter', 'sql beautify', 'pretty print sql', 'format sql query'],
		related: ['regex-tester', 'json-formatter', 'csv-json-converter'],
		faq: [
			{
				question: 'Does my SQL leave my device?',
				answer: 'No. Formatting runs entirely in your browser. Nothing is uploaded to our servers.'
			},
			{
				question: 'Which SQL dialects are supported?',
				answer:
					'This is a lightweight formatter that adds line breaks before common clauses. It works for most ANSI-style SQL but does not parse every dialect-specific syntax.'
			},
			{
				question: 'Can I disable uppercase keywords?',
				answer:
					'Yes. Turn off Uppercase keywords to keep the original casing while still adding line breaks.'
			}
		],
		howTo: ['Paste your SQL', 'Toggle keyword casing if needed', 'Copy the formatted query']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['uppercaseKeywords'] }
};
