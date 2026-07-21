<script lang="ts">
	type Props = {
		data: Record<string, unknown> | Array<Record<string, unknown> | null> | null;
	};

	let { data }: Props = $props();

	const blocks = $derived(!data ? [] : Array.isArray(data) ? data.filter(Boolean) : [data]);

	function toScript(block: Record<string, unknown>) {
		// JSON-LD must be a real <script> tag; content is app-owned schema, not user HTML.
		return `<script type="application/ld+json">${JSON.stringify(block)}<` + `/script>`;
	}
</script>

<!-- JSON-LD injection — structured data only, never user-provided HTML -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{#each blocks as block, i (i)}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html toScript(block as Record<string, unknown>)}
{/each}
