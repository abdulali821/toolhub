import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const MAX_PREVIEW_ROWS = 500;

export const CSV_FILE_CONSTRAINTS = {
	maxBytes: 2 * 1024 * 1024,
	accept: 'text/csv,.csv',
	mimeAllowlist: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
	extensions: ['.csv']
};

export const inputSchema = v.object({
	csv: v.string(),
	query: v.optional(v.string(), '')
});

export type CsvViewerInput = v.InferInput<typeof inputSchema>;

export type CsvViewerOutput = {
	headers: string[];
	rows: string[][];
	filteredRows: string[][];
	rowCount: number;
	filteredCount: number;
	columnCount: number;
	truncated: boolean;
};

/**
 * Parse CSV text into rows of cells, handling quoted fields with embedded
 * commas/newlines and doubled-quote (`""`) escapes. Delimiter is a fixed comma.
 */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let inQuotes = false;
	const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

	for (let i = 0; i < src.length; i++) {
		const ch = src[i]!;
		if (inQuotes) {
			if (ch === '"') {
				if (src[i + 1] === '"') {
					cell += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cell += ch;
			}
			continue;
		}
		if (ch === '"') {
			inQuotes = true;
			continue;
		}
		if (ch === ',') {
			row.push(cell);
			cell = '';
			continue;
		}
		if (ch === '\n') {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
			continue;
		}
		cell += ch;
	}

	if (cell.length > 0 || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}

	return rows;
}

function escapeCell(value: string, delimiter: string): string {
	if (/["\n\r]/.test(value) || value.includes(delimiter)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/** Serialize rows back to delimited text (CSV by default, TSV when `delimiter` is `\t`). */
export function rowsToDelimited(rows: string[][], delimiter = ','): string {
	return rows
		.map((row) => row.map((cell) => escapeCell(cell, delimiter)).join(delimiter))
		.join('\n');
}

export function rowsToCsv(rows: string[][]): string {
	return rowsToDelimited(rows, ',');
}

export function rowsToTsv(rows: string[][]): string {
	return rowsToDelimited(rows, '\t');
}

/** Pad/truncate a row to exactly `length` cells so jagged CSV rows render consistently. */
function normalizeRow(row: string[], length: number): string[] {
	if (row.length === length) return row;
	const next = row.slice(0, length);
	while (next.length < length) next.push('');
	return next;
}

export function run(input: CsvViewerInput): CsvViewerOutput {
	const table = parseCsv(input.csv ?? '');
	const headers = table[0] ?? [];
	const rows = table.slice(1).map((row) => normalizeRow(row, headers.length));
	const query = (input.query ?? '').trim().toLowerCase();
	const filteredRows = query
		? rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(query)))
		: rows;

	return {
		headers,
		rows,
		filteredRows,
		rowCount: rows.length,
		filteredCount: filteredRows.length,
		columnCount: headers.length,
		truncated: filteredRows.length > MAX_PREVIEW_ROWS
	};
}

const SAMPLE_CSV = `name,role,department
Ada Lovelace,Engineer,R&D
Grace Hopper,Rear Admiral,"Navy, Reserve"
"Turing, Alan",Mathematician,Codebreaking`;

export const csvViewer: ToolDefinition<CsvViewerInput, CsvViewerOutput> = {
	id: 'csv-viewer',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['csv', 'table', 'viewer', 'filter', 'search'],
	capabilities: ['upload', 'copy', 'share', 'reset', 'favorite'],
	file: CSV_FILE_CONSTRAINTS,
	share: {
		// Only the filter query is shareable — the CSV body can be large/sensitive.
		params: ['query'],
		maxParamBytes: 500
	},
	presets: [
		{
			id: 'sample',
			label: 'Sample CSV',
			params: { csv: SAMPLE_CSV, query: '' }
		},
		{
			id: 'clear',
			label: 'Clear',
			params: { csv: '', query: '' }
		}
	],
	workflow: {
		next: ['csv-json-converter', 'find-replace', 'json-formatter']
	},
	metadata: {
		name: 'CSV Viewer',
		title: 'CSV Viewer — Preview, search, and filter CSV files',
		description:
			'Paste CSV text or upload a .csv file to preview it as a table, search across every column, and copy the filtered rows as CSV or TSV. Runs fully in your browser.',
		keywords: ['csv viewer', 'csv preview', 'view csv online', 'csv search', 'csv filter'],
		related: ['csv-json-converter', 'find-replace', 'json-formatter'],
		faq: [
			{
				question: 'How large a CSV can I load?',
				answer:
					'Uploaded files are limited to about 2 MB. The table preview shows up to 500 rows at a time (matching rows if you search); everything beyond that is still counted but not rendered, to keep the page responsive.'
			},
			{
				question: 'How does the search work?',
				answer:
					'It performs a case-insensitive substring match across every column in each row. A row matches if any cell contains the search text.'
			},
			{
				question: 'How are quoted fields handled?',
				answer:
					'Fields wrapped in double quotes may contain commas or newlines, and `""` inside a quoted field is treated as a literal quote character — the parser follows standard CSV quoting rules.'
			},
			{
				question: 'Is my CSV uploaded anywhere?',
				answer: 'No. Parsing, searching, and exporting all happen locally in your browser.'
			}
		],
		howTo: [
			'Paste CSV text or upload a .csv file',
			'Search to filter rows across every column',
			'Review row/column counts and the table preview',
			'Copy the filtered rows as CSV or TSV'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
