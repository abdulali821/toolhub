<script lang="ts">
	import { getTool } from '$tools';
	import ToolFrame from '$ui/tools/ToolFrame.svelte';
	import ToolMount from '$ui/tools/ToolMount.svelte';
	import SeoHead from '$ui/seo/SeoHead.svelte';
	import JsonLd from '$ui/seo/JsonLd.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const definition = $derived(getTool(data.tool.id));
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<JsonLd data={data.jsonLd} />

<ToolFrame
	name={data.tool.name}
	description={data.tool.description}
	categoryLabel={data.tool.categoryLabel}
	categoryId={data.tool.category}
	related={data.related}
	workflowNext={data.workflowNext}
	faq={data.tool.faq}
	howTo={data.tool.howTo}
	capabilities={data.tool.capabilities}
	presets={data.tool.presets}
	shareParams={data.tool.shareParams}
	favorited={data.favorited}
	canFavorite={data.canFavorite}
	adsEnabled={data.adsEnabled}
	loginHref={`/login?next=/tools/${data.tool.id}`}
>
	{#if definition}
		<ToolMount loader={definition.ui.component} />
	{:else}
		<p class="text-sm text-muted">Tool UI is unavailable.</p>
	{/if}
</ToolFrame>
