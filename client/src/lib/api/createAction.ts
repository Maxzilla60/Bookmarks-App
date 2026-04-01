import { nanoid } from 'nanoid';
import { concatMap, finalize, type Observable, Subject, tap } from 'rxjs';
import { toast } from 'svelte-sonner';
import type { AnyComponent } from 'svelte-sonner/dist/types';

type Action<T> = (body: T) => void;

export type ToastMessages<T> = {
	loadingMessage?: (body: T) => string;
	successMessage?: (body: T) => string;
	successIcon?: AnyComponent;
}

export function createAction<T>(
	action: (body: T) => Observable<unknown>,
	{ loadingMessage, successMessage, successIcon }: ToastMessages<T> = {},
): Action<T> {
	const subject = new Subject<T>();
	const toastId = nanoid();

	subject.asObservable().pipe(
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
			},
		),
	).subscribe();

	return (body: T) => subject.next(body);
}
