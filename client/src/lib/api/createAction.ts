import type { BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import { concatMap, type Observable, Subject } from 'rxjs';

type Action<T, R> = {
	updates$: Observable<R>;
	update: (body: T) => void;
}

export function createAction<T, R>(fn: (body: T) => Observable<R>): Action<T, R> {
	const subject: Subject<T> = new Subject<T>();
	const updates$ = subject.asObservable().pipe(
		concatMap(fn),
	);

	return {
		updates$,
		update: (body: T) => subject.next(body),
	};
}

export function createBookmarkAction<T>(fn: (body: T) => Observable<Array<BookmarkFromDB>>): Action<T, Array<BookmarkFromDB>> {
	return createAction<T, Array<BookmarkFromDB>>(fn);
}
