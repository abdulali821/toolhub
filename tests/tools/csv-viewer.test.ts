import { describe, expect, it } from 'vitest';
import { run, parseCsv, rowsToCsv, rowsToTsv, csvViewer } from '../../src/lib/tools/csv-viewer';

describe('csv-viewer', () => {
	describe('parseCsv', () => {
		it('splits a simple comma-separated table', () => {
			expect(parseCsv('a,b,c\n1,2,3')).toEqual([
				['a', 'b', 'c'],
				['1', '2', '3']
			]);
		});

		it('keeps commas inside quoted fields intact', () => {
			expect(parseCsv('name,location\n"Doe, Jane",NYC')).toEqual([
				['name', 'location'],
				['Doe, Jane', 'NYC']
			]);
		});

		it('unescapes doubled quotes inside a quoted field', () => {
			expect(parseCsv('quote\n"She said ""hi"""')).toEqual([['quote'], ['She said "hi"']]);
		});

		it('preserves newlines embedded in quoted fields', () => {
			expect(parseCsv('note\n"line one\nline two"')).toEqual([['note'], ['line one\nline two']]);
		});

		it('normalizes CRLF line endings', () => {
			expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
				['a', 'b'],
				['1', '2']
			]);
		});

		it('does not emit a trailing empty row for a trailing newline', () => {
			expect(parseCsv('a,b\n1,2\n')).toEqual([
				['a', 'b'],
				['1', '2']
			]);
		});

		it('returns an empty array for empty input', () => {
			expect(parseCsv('')).toEqual([]);
		});
	});

	describe('run', () => {
		const csv =
			'name,role\nAda Lovelace,Engineer\nGrace Hopper,Rear Admiral\n"Turing, Alan",Mathematician';

		it('splits headers from data rows and reports counts', () => {
			const out = run({ csv });
			expect(out.headers).toEqual(['name', 'role']);
			expect(out.rows).toHaveLength(3);
			expect(out.columnCount).toBe(2);
			expect(out.rowCount).toBe(3);
			expect(out.filteredCount).toBe(3);
			expect(out.truncated).toBe(false);
		});

		it('filters rows case-insensitively across every column', () => {
			const out = run({ csv, query: 'engineer' });
			expect(out.filteredRows).toEqual([['Ada Lovelace', 'Engineer']]);
			expect(out.filteredCount).toBe(1);
		});

		it('matches on any column, not just the first', () => {
			const out = run({ csv, query: 'mathematician' });
			expect(out.filteredRows).toEqual([['Turing, Alan', 'Mathematician']]);
		});

		it('returns everything when the query is empty', () => {
			const out = run({ csv, query: '   ' });
			expect(out.filteredCount).toBe(out.rowCount);
		});

		it('handles empty csv input gracefully', () => {
			const out = run({ csv: '' });
			expect(out.headers).toEqual([]);
			expect(out.rows).toEqual([]);
			expect(out.columnCount).toBe(0);
		});

		it('flags truncation when filtered rows exceed the preview cap', () => {
			const header = 'n\n';
			const body = Array.from({ length: 600 }, (_, i) => `${i}`).join('\n');
			const out = run({ csv: header + body });
			expect(out.rowCount).toBe(600);
			expect(out.truncated).toBe(true);
		});
	});

	describe('serialization', () => {
		it('round-trips escaped values through rowsToCsv', () => {
			const rows = [
				['name', 'note'],
				['Doe, Jane', 'has "quotes"']
			];
			const csv = rowsToCsv(rows);
			expect(csv).toContain('"Doe, Jane"');
			expect(csv).toContain('"has ""quotes"""');
			expect(parseCsv(csv)).toEqual(rows);
		});

		it('produces tab-separated output for rowsToTsv', () => {
			const tsv = rowsToTsv([
				['a', 'b'],
				['1', '2']
			]);
			expect(tsv).toBe('a\tb\n1\t2');
		});
	});

	it('declares upload/copy/share capabilities and a query-only share config', () => {
		expect(csvViewer.capabilities).toContain('upload');
		expect(csvViewer.capabilities).toContain('copy');
		expect(csvViewer.share?.params).toEqual(['query']);
		expect(csvViewer.file?.extensions).toContain('.csv');
		expect(csvViewer.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});
});
