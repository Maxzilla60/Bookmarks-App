import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		svelte(),
	],
	resolve: {
		alias: {
			'@lib': path.resolve(import.meta.dirname, 'src/lib'),
			'@util': path.resolve(import.meta.dirname, 'src/lib/util'),
			'@api': path.resolve(import.meta.dirname, 'src/lib/api'),
			'@components': path.resolve(import.meta.dirname, 'src/lib/components'),
		},
	},
});
