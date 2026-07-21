import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['csv-to-json', 'json-to-csv']),
	delimiter: v.optional(v.string(), ',')
});

export type CsvJsonInput = v.InferOutput<typeof inputSchema>;
export type CsvJsonOutput = { result: string; error?: string };

function parseCsv(text: string, delimiter: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i]!;
		const next = text[i + 1];
		if (inQuotes) {
			if (ch === '"' && next === '"') {
				cell += '"';
				i += 1;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				cell += ch;
			}
			continue;
		}
		if (ch === '"') {
			inQuotes = true;
		} else if (ch === delimiter) {
			row.push(cell);
			cell = '';
		} else if (ch === '\n') {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
		} else if (ch !== '\r') {
			cell += ch;
		}
	}
	row.push(cell);
	if (row.length > 1 || row[0] !== '' || text.length > 0) rows.push(row);
	return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function escapeCsv(value: string, delimiter: string) {
	if (/["\n\r]/.test(value) || value.includes(delimiter)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export function run(input: CsvJsonInput): CsvJsonOutput {
	try {
		const delimiter = input.delimiter || ',';
		if (input.mode === 'csv-to-json') {
			const rows = parseCsv(input.text.trim(), delimiter);
			if (!rows.length) return { result: '[]' };
			const headers = rows[0]!.map((h) => h.trim() || 'column');
			const data = rows.slice(1).map((row) => {
				const obj: Record<string, string> = {};
				headers.forEach((header, idx) => {
					obj[header] = row[idx] ?? '';
				});
				return obj;
			});
			return { result: JSON.stringify(data, null, 2) };
		}

		const parsed = JSON.parse(input.text) as unknown;
		if (!Array.isArray(parsed)) throw new Error('JSON must be an array of objects');
		if (!parsed.length) return { result: '' };
		const headers = [
			...new Set(
				parsed.flatMap((item) =>
					item && typeof item === 'object' ? Object.keys(item as object) : []
				)
			)
		];
		const lines = [
			headers.map((h) => escapeCsv(h, delimiter)).join(delimiter),
			...parsed.map((item) => {
				const obj = (item ?? {}) as Record<string, unknown>;
				return headers
					.map((h) => escapeCsv(obj[h] == null ? '' : String(obj[h]), delimiter))
					.join(delimiter);
			})
		];
		return { result: lines.join('\n') };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Conversion failed'
		};
	}
}

export const csvJsonConverter: ToolDefinition<CsvJsonInput, CsvJsonOutput> = {
	id: 'csv-json-converter',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['csv', 'json', 'convert', 'data'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'mode', 'delimiter'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'csv-to-json',
			label: 'CSV → JSON sample',
			params: {
				text: 'name,role\nAda,Engineer\nGrace,Scientist',
				mode: 'csv-to-json',
				delimiter: ','
			}
		},
		{
			id: 'json-to-csv',
			label: 'JSON → CSV sample',
			params: {
				text: '[{"name":"Ada","role":"Engineer"},{"name":"Grace","role":"Scientist"}]',
				mode: 'json-to-csv',
				delimiter: ','
			}
		}
	],
	workflow: {
		next: ['json-formatter', 'base64-codec']
	},
	metadata: {
		name: 'CSV ↔ JSON Converter',
		title: 'CSV ↔ JSON Converter — Spreadsheets to arrays and back',
		description:
			'Convert CSV to a JSON array of objects, or turn a JSON array back into CSV. Choose a delimiter, keep work local in your browser, and copy or download the result.',
		keywords: [
			'csv to json',
			'json to csv',
			'csv converter',
			'spreadsheet to json',
			'delimiter csv'
		],
		related: ['json-formatter', 'base64-codec'],
		faq: [
			{
				question: 'Does the first CSV row become keys?',
				answer:
					'Yes. When converting CSV → JSON, the first row is treated as headers and each following row becomes an object.'
			},
			{
				question: 'What shape of JSON is required for JSON → CSV?',
				answer:
					'Provide a JSON array of objects. Column headers are the union of object keys; missing values become empty cells.'
			},
			{
				question: 'Is my data uploaded?',
				answer:
					'No. Conversion runs in your browser. Prefer that for customer lists or internal exports you should not paste into third-party services.'
			}
		],
		howTo: [
			'Paste CSV or JSON',
			'Choose direction and delimiter',
			'Copy or download the converted output'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
