<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Footer, Header, SkipLink } from '$ui';
	import AdSlot from '$ui/marketing/AdSlot.svelte';
	import CommandPalette from '$ui/navigation/CommandPalette.svelte';
	import NavigationProgress from '$ui/navigation/NavigationProgress.svelte';
	import Analytics from '$lib/analytics/Analytics.svelte';
	import { site } from '$lib/config/site';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#18181b" />
</svelte:head>

<Analytics config={data.analytics} />
<NavigationProgress />
<CommandPalette />

<div class="flex min-h-dvh flex-col">
	<SkipLink />
	<Header brand={site.name} user={data.user} />
	<AdSlot enabled={data.adsEnabled} placement="header" class="mx-auto w-full max-w-7xl px-4 pt-4" />
	{@render children()}
	<AdSlot enabled={data.adsEnabled} placement="footer" class="mx-auto w-full max-w-7xl px-4 pb-4" />
	<Footer brand={site.name} />
</div>
