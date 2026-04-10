import { client } from '@api/client';
import type { Category } from 'bookmarksapp-schemas/schemas';
import { isNil } from 'lodash';
import { type Observable, of, shareReplay, switchMap } from 'rxjs';
import { currentTable$ } from './currentTable$';

export const categories$: Observable<Array<Category>> = currentTable$.pipe(
	switchMap(table => {
		if (isNil(table)) {
			return of([]);
		}

		return client.getCategories.query({ table });
	}),
	shareReplay({ bufferSize: 1, refCount: true }),
);
