import { type Draft, produce } from 'immer';
import { remove } from 'lodash';
import { nanoid } from 'nanoid';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BookMaxError {
	id: string;
	message: string;
}

const errorsSubject = new BehaviorSubject<Array<BookMaxError>>([]);
export const errors$: Observable<Array<BookMaxError>> = errorsSubject.asObservable();

export function showError(errorMessage: string): void {
	errorsSubject.next(produce(errorsSubject.value, (draft: Draft<Array<BookMaxError>>) => {
		draft.push({
			id: nanoid(),
			message: errorMessage,
		});
	}));
}

export function dismissError(id: string): void {
	errorsSubject.next(produce(errorsSubject.value, (draft: Draft<Array<BookMaxError>>) => {
		remove(draft, e => e.id === id);
	}));
}
