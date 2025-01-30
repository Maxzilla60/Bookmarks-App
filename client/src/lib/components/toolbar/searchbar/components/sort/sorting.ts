import { BehaviorSubject, shareReplay } from 'rxjs';
import { BookmarksSort } from '../../../../../util/sort.enum';

const sortTypeSubject = new BehaviorSubject<BookmarksSort>(BookmarksSort.VERSUS_SCORE);
export const sortType$ = sortTypeSubject.asObservable().pipe(
	shareReplay({ bufferSize: 1, refCount: true }),
);

export function toggleSort(): void {
	const isVersusScore = sortTypeSubject.value == BookmarksSort.VERSUS_SCORE;
	sortTypeSubject.next(isVersusScore ? BookmarksSort.POSITION : BookmarksSort.VERSUS_SCORE);
}
