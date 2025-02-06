import type { Category } from 'bookmarksapp-schemas/schemas';
import { Observable, shareReplay, switchMap } from 'rxjs';
import { client } from '../client';
import { currentTable$ } from './currentTable$';

export const categories$: Observable<Array<Category>> = currentTable$.pipe(
	switchMap(table => client.getCategories.query({ table })),
	shareReplay({ bufferSize: 1, refCount: true }),
);
