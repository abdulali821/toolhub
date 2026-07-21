#!/usr/bin/env node
/**
 * Scaffold a new ToolHub plugin.
 *
 * Usage:
 *   pnpm new-tool --id word-counter --name "Word Counter" --category text
 *   pnpm new-tool word-counter
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const toolsDir = path.join(root, 'src', 'lib', 'tools');
const registryPath = path.join(toolsDir, 'registry.ts');

const CATEGORIES = new Set([
	'developer',
	'text',
	'data',
	'image',
	'pdf',
	'color',
	'encoders',
	'converters',
	'generators',
	'calculators'
]);

function parseArgs(argv) {
	const args = { id: '', name: '', category: 'developer', tags: [] };
	const positional = [];

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--id') args.id = argv[++i] ?? '';
		else if (arg === '--name') args.name = argv[++i] ?? '';
		else if (arg === '--category') args.category = argv[++i] ?? 'developer';
		else if (arg === '--tags') args.tags = (argv[++i] ?? '').split(',').filter(Boolean);
		else if (!arg.startsWith('-')) positional.push(arg);
	}

	if (!args.id && positional[0]) args.id = positional[0];
	if (!args.name && positional[1]) args.name = positional.slice(1).join(' ');
	return args;
}

function toSlug(value) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function toPascal(slug) {
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

function toExportName(slug) {
	const pascal = toPascal(slug);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function titleCase(slug) {
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function writeFile(filePath, contents) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	if (fs.existsSync(filePath)) {
		throw new Error(`Refusing to overwrite existing file: ${filePath}`);
	}
	fs.writeFileSync(filePath, contents, 'utf8');
}

function registerInRegistry(id, exportName) {
	let source = fs.readFileSync(registryPath, 'utf8');

	if (source.includes(`from './${id}'`)) {
		console.log(`Registry already imports ${id}; skipping registry edit.`);
		return;
	}

	const importLine = `import { ${exportName} } from './${id}';\n`;
	const lastImport = [...source.matchAll(/^import .+ from '.+';$/gm)].at(-1);
	if (!lastImport) throw new Error('Could not find import block in registry.ts');

	const insertAt = lastImport.index + lastImport[0].length;
	source = source.slice(0, insertAt) + '\n' + importLine.trimEnd() + source.slice(insertAt);

	source = source.replace(/const tools = \[([^\]]*)\] as const;/, (_match, inner) => {
		const items = inner
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		items.push(exportName);
		return `const tools = [${items.join(', ')}] as const;`;
	});

	fs.writeFileSync(registryPath, source, 'utf8');
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const id = toSlug(args.id);
	if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
		console.error(
			'Usage: pnpm new-tool --id <kebab-id> [--name "Display Name"] [--category developer|text|data|image|pdf|color|encoders|converters|generators|calculators]'
		);
		process.exit(1);
	}
	if (!CATEGORIES.has(args.category)) {
		console.error(`Invalid category. Choose one of: ${[...CATEGORIES].join(', ')}`);
		process.exit(1);
	}

	const name = args.name || titleCase(id);
	const exportName = toExportName(id);
	const tags = args.tags.length ? args.tags : id.split('-');
	const dir = path.join(toolsDir, id);

	if (fs.existsSync(dir)) {
		console.error(`Tool folder already exists: ${dir}`);
		process.exit(1);
	}

	writeFile(
		path.join(dir, 'index.ts'),
		`import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.pipe(v.string(), v.minLength(1, 'Enter some text'))
});

export type ${toPascal(id)}Input = v.InferOutput<typeof inputSchema>;
export type ${toPascal(id)}Output = { result: string };

export function run(input: ${toPascal(id)}Input): ${toPascal(id)}Output {
	return { result: input.text };
}

export const ${exportName}: ToolDefinition<${toPascal(id)}Input, ${toPascal(id)}Output> = {
	id: '${id}',
	version: '1.0.0',
	category: '${args.category}',
	mode: 'instant',
	status: 'stable',
	tags: ${JSON.stringify(tags)},
	metadata: {
		name: '${name}',
		title: '${name} — free online tool',
		description: 'Use ${name} instantly in your browser. Free, private, and fast.',
		keywords: ${JSON.stringify([name.toLowerCase(), ...tags])},
		related: [],
		faq: [
			{
				question: 'Does my data leave my device?',
				answer: 'No. This tool runs locally in your browser.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
`
	);

	writeFile(
		path.join(dir, 'ui.svelte'),
		`<script lang="ts">
	import { Button, Field, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { run } from './index';

	let text = $state('');
	let result = $derived(text ? run({ text }).result : '');
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="${id}-input" label="Input" required>
		<Textarea id="${id}-input" bind:value={text} rows={8} />
	</Field>

	<Field id="${id}-output" label="Output">
		<Textarea id="${id}-output" value={result} rows={8} readonly />
	</Field>

	<div class="flex flex-wrap gap-2">
		<CopyButton value={result} />
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onclick={() => {
				text = '';
			}}>Clear</Button
		>
	</div>
</div>
`
	);

	writeFile(
		path.join(dir, 'README.md'),
		`# ${name}

Tool id: \`${id}\`

## Develop

1. Implement real logic in \`run\` inside \`index.ts\`
2. Adjust UI in \`ui.svelte\`
3. Add tests under \`tests/tools/${id}.test.ts\`
`
	);

	writeFile(
		path.join(root, 'tests', 'tools', `${id}.test.ts`),
		`import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/${id}';

describe('${id}', () => {
	it('returns a result', () => {
		expect(run({ text: 'hello' }).result).toBe('hello');
	});
});
`
	);

	registerInRegistry(id, exportName);

	console.log(`Created tool plugin at src/lib/tools/${id}/`);
	console.log(`Registered ${exportName} in src/lib/tools/registry.ts`);
	console.log(`Next: implement run() and refine metadata, then open /tools/${id}`);
}

main();
