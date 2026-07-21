import { describe, expect, it } from 'vitest';
import { formatSql, run } from '../../src/lib/tools/sql-formatter';

describe('sql-formatter', () => {
	it('breaks lines before major clauses', () => {
		const result = run({
			sql: 'select id, name from users where active = true order by name limit 10',
			uppercaseKeywords: true
		});
		expect(result.formatted).toContain('SELECT');
		expect(result.formatted).toContain('FROM');
		expect(result.formatted).toContain('WHERE');
		expect(result.formatted.split('\n').length).toBeGreaterThan(3);
	});

	it('can preserve keyword casing', () => {
		const formatted = formatSql('select id from users', false);
		expect(formatted).toMatch(/^select/i);
		expect(formatted).toContain('from');
	});

	it('formats INSERT and UPDATE statements', () => {
		const insert = formatSql('insert into users (name) values ("Ada")', true);
		expect(insert).toContain('INSERT INTO');
		expect(insert).toContain('VALUES');

		const update = formatSql('update users set active = false where id = 1', true);
		expect(update).toContain('UPDATE');
		expect(update).toContain('SET');
		expect(update).toContain('WHERE');
	});
});
