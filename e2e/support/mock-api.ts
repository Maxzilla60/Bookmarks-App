import type { Page, WebSocketRoute } from '@playwright/test';
import type { BookmarkFromDB, BookmarkTable, VersusVote } from 'bookmarksapp-schemas/schemas';

export type MockApiOptions = {
	tables?: Array<BookmarkTable>;
	bookmarks?: Array<BookmarkFromDB>;
	votes?: Array<VersusVote>;
};

type TRPCWsMsg = {
	id: number;
	method: string;
	params?: { path: string; input: unknown };
};

// ─── tRPC response helpers ───────────────────────────────────────────────────

/** Wraps an array of results in the tRPC HTTP batch response envelope. */
function trpcBatchResponse(results: Array<unknown>): string {
	return JSON.stringify(results.map(data => ({ result: { data } })));
}

// ─── WebSocket connection handler ────────────────────────────────────────────

class MockWsConnection {
	private subscriptions = new Map<number, string>(); // subscriptionId → procedure path

	constructor(
		private readonly ws: WebSocketRoute,
		private tables: Array<BookmarkTable>,
		private bookmarks: Array<BookmarkFromDB>,
		private votes: Array<VersusVote>,
	) {
		ws.onMessage(raw => {
			const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as unknown as ArrayBuffer);
			// tRPC's wsLink batches subscriptions into a JSON array when multiple
			// subscriptions are started in the same microtask.
			let parsed: unknown;
			try { parsed = JSON.parse(text); } catch { return; }

			const messages: Array<TRPCWsMsg> = Array.isArray(parsed) ? parsed : [parsed as TRPCWsMsg];

			for (const msg of messages) {
				if (msg.method === 'subscription') {
					const path = msg.params!.path;
					this.subscriptions.set(msg.id, path);
					ws.send(JSON.stringify({ id: msg.id, result: { type: 'started' } }));

					// Immediately deliver the current snapshot for this subscription
					if (path === 'watchTables') {
						ws.send(JSON.stringify({ id: msg.id, result: { type: 'data', data: this.tables } }));
					} else if (path === 'watchBookmarks') {
						ws.send(JSON.stringify({ id: msg.id, result: { type: 'data', data: this.bookmarks } }));
					} else if (path === 'watchVotes') {
						ws.send(JSON.stringify({ id: msg.id, result: { type: 'data', data: this.votes } }));
					}
				} else if (msg.method === 'subscription.stop') {
					this.subscriptions.delete(msg.id);
				}
			}
		});
	}

	pushTables(tables: Array<BookmarkTable>): void {
		this.tables = tables;
		for (const [id, path] of this.subscriptions) {
			if (path === 'watchTables') {
				this.ws.send(JSON.stringify({ id, result: { type: 'data', data: tables } }));
			}
		}
	}

	pushBookmarks(bookmarks: Array<BookmarkFromDB>): void {
		this.bookmarks = bookmarks;
		for (const [id, path] of this.subscriptions) {
			if (path === 'watchBookmarks') {
				this.ws.send(JSON.stringify({ id, result: { type: 'data', data: bookmarks } }));
			}
		}
	}

	pushVotes(votes: Array<VersusVote>): void {
		this.votes = votes;
		for (const [id, path] of this.subscriptions) {
			if (path === 'watchVotes') {
				this.ws.send(JSON.stringify({ id, result: { type: 'data', data: votes } }));
			}
		}
	}
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Manages the mocked tRPC API for a single test.
 * - HTTP queries/mutations are intercepted via `page.route()`
 * - WebSocket subscriptions are intercepted via `page.routeWebSocket()`
 *
 * Must be set up before `page.goto()`.
 */
export class MockApi {
	private connections: Array<MockWsConnection> = [];

	constructor(
		private tables: Array<BookmarkTable>,
		private bookmarks: Array<BookmarkFromDB>,
		private votes: Array<VersusVote>,
	) {}

	handleWsConnection(ws: WebSocketRoute): void {
		this.connections.push(
			new MockWsConnection(ws, [...this.tables], [...this.bookmarks], [...this.votes]),
		);
	}

	/** Push an updated tables list to all active WebSocket subscriptions. */
	pushTables(tables: Array<BookmarkTable>): void {
		this.tables = tables;
		for (const conn of this.connections) conn.pushTables(tables);
	}

	/** Push an updated bookmark list to all active WebSocket subscriptions. */
	pushBookmarks(bookmarks: Array<BookmarkFromDB>): void {
		this.bookmarks = bookmarks;
		for (const conn of this.connections) conn.pushBookmarks(bookmarks);
	}

	/** Push updated votes to all active WebSocket subscriptions. */
	pushVotes(votes: Array<VersusVote>): void {
		this.votes = votes;
		for (const conn of this.connections) conn.pushVotes(votes);
	}
}

/**
 * Installs HTTP and WebSocket mocks for the tRPC server.
 * Call this before `page.goto('/')`.
 *
 * @example
 * const api = await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
 * await page.goto('/');
 * api.pushBookmarks([...]); // send live update
 */
export async function setupMockApi(page: Page, options: MockApiOptions = {}): Promise<MockApi> {
	const tables = options.tables ?? [{ name: 'spellbooks', emoji: '📖' }];
	const bookmarks = options.bookmarks ?? [];
	const votes = options.votes ?? [];

	const mockApi = new MockApi(tables, bookmarks, votes);

	// ── HTTP interception (queries + mutations) ──────────────────────────────
	// tRPC httpBatchLink uses GET for queries, POST for mutations.
	// Multiple procedures can be batched: /proc1,proc2?batch=1
	await page.route('http://localhost:3000/**', async route => {
		const url = new URL(route.request().url());
		// pathname is like "/getCategories" or "/createBookmarks,editBookmark"
		const procedures = url.pathname.slice(1).split(',');

		const results = procedures.map(proc => {
			switch (proc) {
				case 'getCategories':
					return [];
				default:
					return null; // mutations return null/void
			}
		});

		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: trpcBatchResponse(results),
		});
	});

	// ── WebSocket interception (subscriptions) ───────────────────────────────
	// The browser normalises ws://localhost:3001 → ws://localhost:3001/ (trailing
	// slash added), so we match with a regex rather than an exact string.
	await page.routeWebSocket(/localhost:3001/, ws => {
		mockApi.handleWsConnection(ws);
	});

	return mockApi;
}
