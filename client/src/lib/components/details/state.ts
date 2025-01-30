import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { Subject } from 'rxjs';

const bookmarkDetailsSubject: Subject<Bookmark | undefined> = new Subject<Bookmark | undefined>();
export const bookmarkDetails$ = bookmarkDetailsSubject.asObservable();

export function openBookmarkDetails(bookmark?: Bookmark): void {
	bookmarkDetailsSubject.next(bookmark);
}
