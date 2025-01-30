import type { Category } from 'bookmarksapp-schemas/schemas';
import { from, Observable, shareReplay, switchMap } from 'rxjs';
import { client } from '../client';
import { currentTable$ } from './currentTable$';

export const categories$: Observable<Array<Category>> = currentTable$.pipe(
	switchMap(table => from(client.getCategories.query({ table }))),
	shareReplay({ bufferSize: 1, refCount: true }),
);
