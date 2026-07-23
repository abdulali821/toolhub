<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Button, Container, Field, Input, SeoHead, Textarea } from '$ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived({
		toolName: form?.values?.toolName ?? '',
		description: form?.values?.description ?? '',
		category: form?.values?.category ?? '',
		email: form?.values?.email ?? ''
	});
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main" class="flex-1 bg-bg pt-28 pb-20">
	<Container class="max-w-3xl">
		<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">
			<header class="mb-10 border-b border-gray-100 pb-8">
				<div
					class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-900"
					aria-hidden="true"
				>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
						<path
							d="M12 5v14M5 12h14"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
				</div>
				<h1
					class="mb-3 font-display text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl"
				>
					Request a tool
				</h1>
				<p class="text-base leading-relaxed text-gray-600">
					Tell us what would make your workflow easier. We prioritize local-first utilities that fit
					the catalog.
				</p>
			</header>

			{#if form?.message}
				<div class="mb-8">
					<Alert
						variant={form.success ? 'success' : 'danger'}
						title={form.success ? 'Request submitted' : 'Could not submit'}
					>
						{form.message}
					</Alert>
				</div>
			{/if}

			{#if !form?.success}
				<form method="POST" class="relative space-y-6">
					<Field id="toolName" label="Tool name" required error={form?.errors?.toolName}>
						<Input
							id="toolName"
							name="toolName"
							required
							maxlength={120}
							placeholder="e.g. Markdown to HTML"
							value={values.toolName}
							invalid={Boolean(form?.errors?.toolName)}
						/>
					</Field>

					<Field id="category" label="Category" error={form?.errors?.category}>
						<select
							id="category"
							name="category"
							value={values.category}
							class="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-fg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
							aria-invalid={form?.errors?.category ? 'true' : undefined}
						>
							<option value="">Select a category</option>
							{#each data.categories as cat (cat.id)}
								<option value={cat.id}>{cat.label}</option>
							{/each}
							<option value="other">Other</option>
						</select>
					</Field>

					<Field
						id="description"
						label="What should it do?"
						required
						hint="Describe the problem, inputs, and ideal output."
						error={form?.errors?.description}
					>
						<Textarea
							id="description"
							name="description"
							required
							rows={5}
							maxlength={4000}
							placeholder="I often need to convert X into Y without uploading files…"
							value={values.description}
							invalid={Boolean(form?.errors?.description)}
						/>
					</Field>

					<Field
						id="email"
						label="Email (optional)"
						hint="Only if you want a follow-up when we ship it."
						error={form?.errors?.email}
					>
						<Input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							maxlength={254}
							placeholder="you@example.com"
							value={values.email}
							invalid={Boolean(form?.errors?.email)}
						/>
					</Field>

					<!-- Honeypot -->
					<div class="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
						<label for="website">Website</label>
						<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
					</div>

					<div class="flex flex-wrap items-center gap-3 pt-2">
						<Button type="submit">Submit request</Button>
						<a
							href={resolve('/tools')}
							class="text-sm font-medium text-gray-500 no-underline transition-colors hover:text-gray-900"
						>
							Browse existing tools
						</a>
					</div>
				</form>
			{:else}
				<div class="flex flex-wrap gap-3">
					<Button href="/tools" variant="secondary">Browse tools</Button>
					<Button href="/request-tool" data-sveltekit-reload>Request another</Button>
				</div>
			{/if}
		</div>

		<p class="mt-6 text-center text-sm text-gray-500">
			Read how we handle submissions in our
			<a
				href={resolve('/privacy')}
				class="font-medium text-gray-900 underline-offset-2 hover:underline">privacy policy</a
			>.
		</p>
	</Container>
</main>
