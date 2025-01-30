import { isEqual } from 'lodash';
import { auditTime, BehaviorSubject, distinctUntilChanged } from 'rxjs';

const searchTermSubject = new BehaviorSubject<string>('');
export const searchTerm$ = searchTermSubject.asObservable().pipe(
	auditTime(500),
	distinctUntilChanged(isEqual),
);

export function updateSearch(searchTerm: string): void {
	searchTermSubject.next(searchTerm);
}
