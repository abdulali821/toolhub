<script lang="ts">
	import { Alert, Button, Container, Field, Input } from '$ui';
	import { site } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Sign in | {site.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main">
	<Container class="max-w-md py-16">
		<h1 class="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
		<p class="mt-2 text-muted">Save favorites and keep a history of tools you use.</p>

		{#if form?.message}
			<div class="mt-6">
				<Alert
					variant={form.success ? 'success' : 'danger'}
					title={form.success ? 'Success' : 'Error'}
				>
					{form.message}
				</Alert>
			</div>
		{:else if data.message}
			<div class="mt-6">
				<Alert variant="info">{data.message}</Alert>
			</div>
		{/if}

		<form method="POST" action="?/signin" class="mt-8 space-y-4">
			<Field id="email" label="Email" required>
				<Input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</Field>
			<Field id="password" label="Password" required>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					minlength={6}
				/>
			</Field>
			<div class="flex flex-wrap gap-2">
				<Button type="submit">Sign in</Button>
				<Button type="submit" formaction="?/signup" variant="secondary">Create account</Button>
			</div>
		</form>

		<form method="POST" action="?/magic" class="mt-10 space-y-4 border-t border-border pt-8">
			<p class="text-sm font-medium">Or get a magic link</p>
			<Field id="magic-email" label="Email" required>
				<Input
					id="magic-email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.mode === 'magic' ? (form.email ?? '') : ''}
				/>
			</Field>
			<Button type="submit" variant="ghost">Send magic link</Button>
		</form>
	</Container>
</main>
