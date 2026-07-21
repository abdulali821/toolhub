<script lang="ts">
	import { page } from '$app/state';
	import { Button, Container } from '$ui';
</script>

<main id="main" class="flex flex-1 items-center py-24">
	<Container class="text-center">
		<p
			class="animate-rise font-display text-6xl font-semibold tracking-tight text-accent/80 sm:text-7xl"
		>
			{page.status}
		</p>
		<h1
			class="animate-rise-delay-1 mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
		>
			{page.status === 404 ? 'This page isn’t here' : 'Something went wrong'}
		</h1>
		<p class="animate-rise-delay-2 mx-auto mt-4 max-w-md text-pretty text-muted">
			{page.status === 404
				? 'The link may be outdated, or the tool moved. Try search or the full catalog.'
				: (page.error?.message ?? 'An unexpected error occurred.')}
		</p>
		<div class="animate-rise-delay-2 mt-10 flex flex-wrap justify-center gap-3">
			<Button href="/">Back home</Button>
			<Button href="/tools" variant="secondary">Browse tools</Button>
			<Button href="/search" variant="ghost">Search</Button>
		</div>
	</Container>
</main>
