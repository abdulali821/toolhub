<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '$lib/config/site';
</script>

<svelte:head>
	<title>Account | {site.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<p class="max-w-xl text-muted">
	Manage your favorites and recent tool history. More account features land in later phases.
</p>

<ul class="mt-8 grid gap-4 sm:grid-cols-2">
	<li class="rounded-md border border-border bg-bg-elevated p-5">
		<a
			href={resolve('/account/favorites')}
			class="font-display text-lg font-semibold text-fg no-underline"
		>
			Favorites
		</a>
		<p class="mt-1 text-sm text-muted">Tools you starred for quick access.</p>
	</li>
	<li class="rounded-md border border-border bg-bg-elevated p-5">
		<a
			href={resolve('/account/history')}
			class="font-display text-lg font-semibold text-fg no-underline"
		>
			History
		</a>
		<p class="mt-1 text-sm text-muted">Recently opened tools on this account.</p>
	</li>
</ul>
