import { nanoid } from 'nanoid';
import { BehaviorSubject, type Observable } from 'rxjs';

export interface BookMaxError {
	id: string;
	message: string;
}

const errorsSubject = new BehaviorSubject<Array<BookMaxError>>([]);
export const errors$: Observable<Array<BookMaxError>> = errorsSubject.asObservable();

export function showError(errorMessage: string): void {
	const newError: BookMaxError = {
		id: nanoid(),
		message: errorMessage,
	};
	errorsSubject.next([...errorsSubject.value, newError]);
}

export function dismissError(id: string): void {
	const newErrorsArray = errorsSubject.value.filter(e => e.id !== id);
	errorsSubject.next(newErrorsArray);
}
