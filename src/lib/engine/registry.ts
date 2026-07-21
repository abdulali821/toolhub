import type { CategoryId } from '$lib/config/site';
import { categories } from '$lib/config/site';
import type { ToolDefinition, ToolId, ToolSummary } from './types';

const registry = new Map<ToolId, ToolDefinition>();

export function clearRegistry() {
	registry.clear();
}

/**
 * Register a tool plugin. Throws on duplicate ids within a single registration pass.
 * Call `clearRegistry()` before bulk re-registration (e.g. Vite HMR).
 */
export function registerTool(tool: ToolDefinition) {
	if (registry.has(tool.id)) {
		throw new Error(`Duplicate tool id: ${tool.id}`);
	}
	registry.set(tool.id, tool);
}

export function getTool(id: ToolId): ToolDefinition | undefined {
	return registry.get(id);
}

export function requireTool(id: ToolId): ToolDefinition {
	const tool = getTool(id);
	if (!tool) throw new Error(`Unknown tool: ${id}`);
	return tool;
}

export type ListToolsOptions = {
	category?: CategoryId;
	tag?: string;
	q?: string;
	includeDeprecated?: boolean;
};

function toSummary(tool: ToolDefinition): ToolSummary {
	return {
		id: tool.id,
		name: tool.metadata.name,
		title: tool.metadata.title,
		description: tool.metadata.description,
		category: tool.category,
		tags: tool.tags,
		status: tool.status,
		mode: tool.mode
	};
}

function tokenize(value: string): string[] {
	return value
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
}

function searchScore(tool: ToolDefinition, query: string): number {
	const q = query.trim().toLowerCase();
	if (!q) return 0;

	const tokens = tokenize(q);
	const id = tool.id.toLowerCase();
	const name = tool.metadata.name.toLowerCase();
	const title = tool.metadata.title.toLowerCase();
	const description = tool.metadata.description.toLowerCase();
	const tags = tool.tags.map((t) => t.toLowerCase());
	const keywords = (tool.metadata.keywords ?? []).map((k) => k.toLowerCase());
	const haystack = [id, name, title, description, ...tags, ...keywords].join(' ');

	let score = 0;
	if (id === q) score += 100;
	if (name === q) score += 80;
	if (id.startsWith(q) || name.startsWith(q)) score += 40;
	if (haystack.includes(q)) score += 20;

	for (const token of tokens) {
		if (id.includes(token)) score += 12;
		if (name.includes(token)) score += 10;
		if (tags.includes(token)) score += 8;
		if (keywords.some((k) => k.includes(token))) score += 6;
		if (description.includes(token)) score += 3;
	}

	return score;
}

export function listTools(options: ListToolsOptions = {}): ToolSummary[] {
	const query = options.q?.trim().toLowerCase();

	const filtered = [...registry.values()].filter((tool) => {
		if (!options.includeDeprecated && tool.status === 'deprecated') return false;
		if (options.category && tool.category !== options.category) return false;
		if (options.tag && !tool.tags.includes(options.tag)) return false;
		if (query && searchScore(tool, query) <= 0) return false;
		return true;
	});

	if (query) {
		return filtered
			.map((tool) => ({ tool, score: searchScore(tool, query) }))
			.sort((a, b) => b.score - a.score || a.tool.metadata.name.localeCompare(b.tool.metadata.name))
			.map(({ tool }) => toSummary(tool));
	}

	return filtered.map(toSummary).sort((a, b) => a.name.localeCompare(b.name));
}

function relatedScore(source: ToolDefinition, candidate: ToolDefinition): number {
	let score = 0;
	if (candidate.category === source.category) score += 5;

	const tagOverlap = candidate.tags.filter((tag) => source.tags.includes(tag)).length;
	score += tagOverlap * 4;

	if (source.workflow?.next?.includes(candidate.id)) score += 20;
	if (source.workflow?.prev?.includes(candidate.id)) score += 8;

	const sourceKeywords = new Set(
		tokenize([source.metadata.name, ...(source.metadata.keywords ?? []), ...source.tags].join(' '))
	);
	const candidateTokens = tokenize(
		[
			candidate.metadata.name,
			candidate.metadata.description,
			...(candidate.metadata.keywords ?? []),
			...candidate.tags
		].join(' ')
	);
	for (const token of candidateTokens) {
		if (sourceKeywords.has(token)) score += 1;
	}

	return score;
}

/** Explicit workflow "next step" tools for the tool page rail. */
export function workflowNextTools(id: ToolId, limit = 3): ToolSummary[] {
	const tool = getTool(id);
	if (!tool?.workflow?.next?.length) return [];

	const seen = new Set<ToolId>();
	const out: ToolSummary[] = [];
	for (const nextId of tool.workflow.next) {
		if (seen.has(nextId) || nextId === id) continue;
		const next = getTool(nextId);
		if (!next || next.status === 'deprecated') continue;
		seen.add(nextId);
		out.push(toSummary(next));
		if (out.length >= limit) break;
	}
	return out;
}

export function relatedTools(id: ToolId, limit = 4): ToolSummary[] {
	const tool = getTool(id);
	if (!tool) return [];

	const explicit = (tool.metadata.related ?? [])
		.map((relatedId) => getTool(relatedId))
		.filter((item): item is ToolDefinition => item != null && item.status !== 'deprecated')
		.map(toSummary);

	if (explicit.length >= limit) return explicit.slice(0, limit);

	const remaining = limit - explicit.length;
	const seen = new Set([id, ...explicit.map((item) => item.id)]);

	const scored = [...registry.values()]
		.filter((item) => !seen.has(item.id) && item.status !== 'deprecated')
		.map((item) => ({ item, score: relatedScore(tool, item) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score || a.item.metadata.name.localeCompare(b.item.metadata.name))
		.slice(0, remaining)
		.map(({ item }) => toSummary(item));

	return [...explicit, ...scored];
}

export function allToolIds(): ToolId[] {
	return [...registry.keys()];
}

export function countToolsByCategory(): Record<CategoryId, number> {
	const counts = Object.fromEntries(categories.map((c) => [c.id, 0])) as Record<CategoryId, number>;

	for (const tool of registry.values()) {
		if (tool.status === 'deprecated') continue;
		counts[tool.category] += 1;
	}

	return counts;
}

/** @deprecated Prefer clearRegistry() */
export function __resetRegistryForTests() {
	clearRegistry();
}
