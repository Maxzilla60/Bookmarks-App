import type { BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import { nanoid } from 'nanoid';
import { concatMap, finalize, type Observable, Subject, tap } from 'rxjs';
import { toast } from 'svelte-sonner';
import type { AnyComponent } from 'svelte-sonner/dist/types';

type Action<T, R> = {
	updates$: Observable<R>;
	update: (body: T) => void;
}

export type ToastMessages<T> = {
	loadingMessage?: (body: T) => string;
	successMessage?: (body: T) => string;
	successIcon?: AnyComponent;
}

export function createAction<T, R>(action: (body: T) => Observable<R>, { loadingMessage, successMessage, successIcon }: ToastMessages<T> = {}): Action<T, R> {
	const subject: Subject<T> = new Subject<T>();
	const toastId = nanoid();
	const updates$ = subject.asObservable().pipe(
		tap(body => {
			if (loadingMessage) {
				toast.loading(loadingMessage(body), { id: toastId });
			}
		}),
		concatMap(body => {
			return action(body).pipe(
				finalize(() => {
					if (successMessage) {
						toast.success(successMessage(body), { id: toastId, icon: successIcon });
					} else {
						toast.dismiss(toastId);
					}
				}),
			);
		}),
	);

	return {
		updates$,
		update: (body: T) => subject.next(body),
	};
}

export function createBookmarkAction<T>(action: (body: T) => Observable<Array<BookmarkFromDB>>, toastMessages: ToastMessages<T> = {}): Action<T, Array<BookmarkFromDB>> {
	return createAction(action, toastMessages);
}
