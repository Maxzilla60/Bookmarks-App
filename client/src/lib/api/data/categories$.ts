import { client } from '@api/client';
import type { Category } from 'bookmarksapp-schemas/schemas';
import { type Observable, shareReplay, switchMap } from 'rxjs';
import { currentTable$ } from './currentTable$';

export const categories$: Observable<Array<Category>> = currentTable$.pipe(
	switchMap(table => client.getCategories.query({ table })),
	shareReplay({ bufferSize: 1, refCount: true }),
);
