import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ out: 'build' }),
			alias: {
				$engine: 'src/lib/engine',
				$tools: 'src/lib/tools',
				$seo: 'src/lib/seo',
				$ui: 'src/lib/ui',
				$server: 'src/lib/server'
			}
		})
	],
	test: {
		include: [
			'src/**/*.{test,spec}.{js,ts}',
			'tests/unit/**/*.{test,spec}.{js,ts}',
			'tests/tools/**/*.{test,spec}.{js,ts}'
		]
	}
});
