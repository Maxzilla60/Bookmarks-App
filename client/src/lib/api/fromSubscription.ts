import { Observable } from 'rxjs';

type SubscriptionHandlers<T> = {
	onData: (data: T) => void;
	onError: (err: unknown) => void;
	onComplete: () => void;
};

/**
 * Converts a tRPC subscription call (backed by a server-side async generator)
 * into an RxJS `Observable<T>`.
 *
 * Unsubscribing from the Observable calls `tRPCSub.unsubscribe()`, which aborts
 * the server's generator cleanly via its tRPC `signal`.
 *
 * @example
 * fromSubscription<BookmarkFromDB[]>(callbacks =>
 *   client.watchBookmarks.subscribe({ table }, callbacks)
 * )
 */
export function fromSubscription<T>(
	subscribe: (handlers: SubscriptionHandlers<T>) => { unsubscribe: () => void },
): Observable<T> {
	return new Observable<T>(observer => {
		const sub = subscribe({
			onData: data => observer.next(data),
			onError: err => observer.error(err),
			onComplete: () => observer.complete(),
		});
		return () => sub.unsubscribe();
	});
}
