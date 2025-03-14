import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'bookmarksapp-server/server';

export const client = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: 'http://localhost:3000',
		}),
	],
});
