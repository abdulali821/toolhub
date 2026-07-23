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

		<form method="POST" action="?/google" class="mt-8">
			<Button type="submit" variant="secondary" class="w-full gap-2">
				<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="#4285F4"
						d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
					/>
					<path
						fill="#34A853"
						d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3a7.2 7.2 0 0 1-10.76-3.78H1.3v3.09A12 12 0 0 0 12 24Z"
					/>
					<path
						fill="#FBBC05"
						d="M5.3 14.31a7.2 7.2 0 0 1 0-4.62V6.6H1.3a12 12 0 0 0 0 10.8l4-3.09Z"
					/>
					<path
						fill="#EA4335"
						d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.3 6.6l4 3.09A7.16 7.16 0 0 1 12 4.75Z"
					/>
				</svg>
				Continue with Google
			</Button>
		</form>

		<div
			class="my-8 flex items-center gap-3 text-xs font-medium tracking-wide text-gray-400 uppercase"
		>
			<span class="h-px flex-1 bg-gray-200"></span>
			<span>or email</span>
			<span class="h-px flex-1 bg-gray-200"></span>
		</div>

		<form method="POST" action="?/signin" class="space-y-4">
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
				<Button type="submit" class="flex-1">Sign in</Button>
				<Button type="submit" formaction="?/signup" variant="secondary" class="flex-1"
					>Create account</Button
				>
			</div>
		</form>

		<p class="mt-6 text-sm text-muted">
			Google sign-in requires the Google provider enabled in your Supabase Auth settings.
		</p>
	</Container>
</main>
