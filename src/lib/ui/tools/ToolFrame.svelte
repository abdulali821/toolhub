<script lang="ts">
	import type { Snippet } from 'svelte';
	import Breadcrumb from '$ui/navigation/Breadcrumb.svelte';
	import Container from '$ui/layout/Container.svelte';
	import type { FaqItem, ToolCapability, ToolPreset, ToolSummary } from '$engine/types';
	import RelatedTools from '$ui/tools/RelatedTools.svelte';
	import ToolFaq from '$ui/tools/ToolFaq.svelte';
	import ToolHowTo from '$ui/tools/ToolHowTo.svelte';
	import ToolActionBar from '$ui/tools/ToolActionBar.svelte';
	import AdSlot from '$ui/marketing/AdSlot.svelte';
	import Button from '$ui/primitives/Button.svelte';
	import {
		setToolShellContext,
		type ToolShellActions,
		type ToolShellContext
	} from '$ui/tools/tool-shell-context';
	import { copyText } from '$engine/share-state';

	type Props = {
		name: string;
		description: string;
		categoryLabel: string;
		categoryId: string;
		related: ToolSummary[];
		workflowNext?: ToolSummary[];
		faq?: FaqItem[];
		howTo?: string[];
		capabilities?: ToolCapability[];
		presets?: ToolPreset[];
		shareParams?: string[];
		favorited?: boolean;
		canFavorite?: boolean;
		loginHref?: string;
		adsEnabled?: boolean;
		children: Snippet;
	};

	let {
		name,
		description,
		categoryLabel,
		categoryId,
		related,
		workflowNext = [],
		faq = [],
		howTo = [],
		capabilities = [],
		presets = [],
		shareParams = [],
		favorited = false,
		canFavorite = false,
		loginHref = '/login',
		adsEnabled = false,
		children
	}: Props = $props();

	let shellActions = $state<ToolShellActions>({});
	let shareStatus = $state<'idle' | 'copied' | 'failed'>('idle');

	const shell: ToolShellContext = {
		getActions: () => shellActions,
		setActions: (next) => {
			shellActions = next;
		}
	};

	setToolShellContext(shell);

	const showHeaderFavorite = $derived(!capabilities.includes('favorite'));
	const showHeaderShare = $derived(capabilities.includes('share'));

	async function onShare() {
		const ok = await copyText(window.location.href);
		shareStatus = ok ? 'copied' : 'failed';
		setTimeout(() => {
			shareStatus = 'idle';
		}, 1500);
	}
</script>

<main id="main">
	<Container class="py-8 sm:py-12">
		<Breadcrumb
			items={[
				{ label: 'Home', href: '/' },
				{ label: 'Tools', href: '/tools' },
				{ label: categoryLabel, href: `/tools?category=${categoryId}` },
				{ label: name }
			]}
		/>

		<header class="mt-6 flex flex-wrap items-start justify-between gap-4 sm:mt-8">
			<div class="animate-rise max-w-3xl">
				<p class="text-xs font-semibold tracking-widest text-muted uppercase">{categoryLabel}</p>
				<h1
					class="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl"
				>
					{name}
				</h1>
				<p class="mt-3 text-base text-pretty text-muted sm:mt-4 sm:text-lg">{description}</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if showHeaderFavorite}
					{#if canFavorite}
						<form method="POST" action="?/toggleFavorite">
							<input type="hidden" name="favorited" value={favorited ? '1' : '0'} />
							<Button type="submit" variant="secondary" size="sm">
								{favorited ? 'Starred' : 'Save to Starred'}
							</Button>
						</form>
					{:else}
						<a
							href={loginHref}
							class="pressable inline-flex h-8 items-center rounded-lg border border-border bg-bg-elevated px-3 text-sm font-medium text-fg no-underline hover:bg-bg"
							>Sign in to star</a
						>
					{/if}
				{/if}
				{#if showHeaderShare}
					<Button type="button" variant="primary" size="sm" onclick={onShare}>
						{shareStatus === 'copied' ? 'Link copied' : 'Share Tool'}
					</Button>
				{/if}
			</div>
		</header>

		<div
			class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_18rem]"
		>
			<section
				class="animate-rise-delay-1 rounded-2xl border border-border bg-bg-elevated p-4 shadow-premium sm:p-6"
				aria-label="Tool"
			>
				<ToolActionBar
					{capabilities}
					{presets}
					{shareParams}
					actions={shellActions}
					{favorited}
					{canFavorite}
					{loginHref}
				/>
				{@render children()}
			</section>

			<aside class="space-y-4">
				<div class="rounded-2xl border border-border bg-bg-elevated p-5 shadow-premium">
					<p class="text-xs font-semibold tracking-wider text-muted uppercase">About</p>
					<p class="mt-3 text-sm text-pretty text-muted">{description}</p>
					<ul class="mt-4 space-y-3 text-sm text-muted">
						<li class="flex items-start gap-2.5">
							<svg
								class="mt-0.5 shrink-0 text-fg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
							</svg>
							<span
								><strong class="font-medium text-fg">Privacy first</strong> — runs locally in your browser.</span
							>
						</li>
						<li class="flex items-start gap-2.5">
							<svg
								class="mt-0.5 shrink-0 text-fg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M13 3L5 14h6l-1 7 9-12h-6l0-6z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
							</svg>
							<span><strong class="font-medium text-fg">Instant</strong> — no upload wait.</span>
						</li>
					</ul>
				</div>
				{#if related.length}
					<div class="rounded-2xl border border-border bg-bg-elevated p-5 shadow-premium">
						<RelatedTools tools={related.slice(0, 4)} compact />
					</div>
				{/if}
			</aside>
		</div>

		<AdSlot enabled={adsEnabled} placement="in-content" class="mt-10" />

		{#if howTo.length}
			<div class="mt-12 border-t border-border pt-10 sm:mt-14 sm:pt-12">
				<ToolHowTo steps={howTo} />
			</div>
		{/if}

		{#if workflowNext.length}
			<div class="mt-12 border-t border-border pt-10 sm:mt-14 sm:pt-12">
				<RelatedTools tools={workflowNext} title="Next step" />
			</div>
		{/if}

		{#if faq.length}
			<div class="mt-12 border-t border-border pt-10 sm:mt-14 sm:pt-12">
				<ToolFaq items={faq} />
			</div>
		{/if}
	</Container>
</main>
